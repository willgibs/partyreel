#!/usr/bin/env python3
"""calls.py: the calls' one door (docs/calls.json), the only writer the record uses.

  python3 usher/kit/calls.py add <entry.json>        one entry, or a list of them, placed and checked: all or nothing
  python3 usher/kit/calls.py retire <id> [<id> ...]  answered entries leave the list; an id is never used again
  python3 usher/kit/calls.py check                   every rule over the file as it stands; writes nothing

--root <dir> works on <dir>/docs/calls.json and its homes (default: the current directory, the repo's root).

THE CALLS (Will, 2026-10-07: never a decision log; "probably just build it into the lab"): only the decisions built into
Partyreel that he cannot see by using it, where his view may differ (the runbook's "The calls lab" holds the test). He
answers them at the desk's Calls place, the answers ride the desk's one message, `pnpm lab:review` prints where each
goes, and the record retires each answered entry here the same day.

An entry is {"id", "kind": "question" | "call", "theme", "title", "body"} with, for a question, "recommended" and
"alternatives" (a list, possibly empty), and for a call, "changeIf" and "home" (the docs/systems/ doc that holds the
fact, so a kept call can leave). Refused, with nothing written: a field missing, empty or unknown; a field past its
lines (a line is 120 characters: a title or a "Change it if" one, a body or a recommendation three, an alternative two);
more than four alternatives; a theme the file does not list; a home that is not an existing docs/systems/*.md; an id
malformed, open already, or used before (retired); the 31st entry. So a design call or a runaway append cannot get in.

★ NO EDIT IN PLACE. An entry's words are what Will answers; new words under the same id would carry his answer to words
he never saw. An entry that must change is retired and added again under a new id.
"""
import json, re, sys, pathlib

CAP = 30
LINE = 120
LINES = {"title": 1, "body": 3, "changeIf": 1, "recommended": 3, "alternative": 2}
MAX_ALTERNATIVES = 4
KINDS = {"question": ["id", "kind", "theme", "title", "body", "recommended", "alternatives"],
         "call": ["id", "kind", "theme", "title", "body", "changeIf", "home"]}
ID = re.compile(r"^[A-Z]{1,3}[0-9]{1,3}$")
HOME = re.compile(r"^docs/systems/[a-z0-9-]+\.md$")
PRINT_WIDTH = 80  # prettier's, so `pnpm format` leaves what this writes as it is


def entry_problems(e, themes, root):
    """What is wrong with one entry on its own (its shape, its words, its theme and home)."""
    if not isinstance(e, dict): return ["an entry is an object"]
    eid = e.get("id") if isinstance(e.get("id"), str) else "?"
    at = lambda m: f"{eid}: {m}"
    kind = e.get("kind")
    if kind not in KINDS: return [at(f'kind is "question" or "call", not {kind!r}')]
    out = []
    for f in KINDS[kind]:
        if f not in e: out.append(at(f"{f} is missing"))
    for f in e:
        if f not in KINDS[kind]: out.append(at(f"{f} is not a field of a {kind}"))
    if out: return out
    if not ID.match(e["id"]): out.append(at("an id is one to three capitals and a number (X18, CH1)"))
    for f in KINDS[kind]:
        if f == "alternatives": continue
        if not isinstance(e[f], str) or not e[f].strip(): out.append(at(f"{f} is empty")); continue
        if e[f] != e[f].strip() or "\n" in e[f]: out.append(at(f"{f} is one line with no space at its ends"))
        if f in LINES and len(e[f]) > LINES[f] * LINE:
            n = LINES[f]
            out.append(at(f"{f} runs {len(e[f])} characters, past {n} line{'s' if n > 1 else ''} ({n * LINE})"))
    if kind == "question":
        alts = e["alternatives"]
        if not isinstance(alts, list): out.append(at("alternatives is a list")); alts = []
        if len(alts) > MAX_ALTERNATIVES: out.append(at(f"{len(alts)} alternatives, past {MAX_ALTERNATIVES}"))
        for i, a in enumerate(alts, 1):
            if not isinstance(a, str) or not a.strip() or a != a.strip(): out.append(at(f"alternative {i} is empty or untrimmed"))
            elif len(a) > LINES["alternative"] * LINE: out.append(at(f"alternative {i} runs {len(a)} characters, past 2 lines ({2 * LINE})"))
        if len(set(alts)) != len(alts): out.append(at("an alternative is listed twice"))
    if isinstance(e.get("theme"), str) and e["theme"] not in themes: out.append(at(f"theme {e['theme']!r} is not one of {themes}"))
    if kind == "call" and isinstance(e.get("home"), str):
        if not HOME.match(e["home"]): out.append(at(f"home is a docs/systems/<doc>.md path, not {e['home']!r}"))
        elif not (root / e["home"]).is_file(): out.append(at(f"home {e['home']} does not exist"))
    return out


def problems(data, root):
    """Every rule over the whole file; an empty list means it holds."""
    if not isinstance(data, dict) or set(data) != {"themes", "entries", "retired"}:
        return ['the file is {"themes": [...], "entries": [...], "retired": [...]}']
    themes, entries, retired = data["themes"], data["entries"], data["retired"]
    out = []
    if not isinstance(themes, list) or not themes or not all(isinstance(t, str) and t and t == t.strip() and "\n" not in t and len(t) <= LINE for t in themes):
        return ["themes is a list of names"]
    if len(set(themes)) != len(themes): out.append("a theme is listed twice")
    if not isinstance(retired, list) or not all(isinstance(r, str) and ID.match(r) for r in retired):
        out.append("retired is a list of ids"); retired = []
    if len(set(retired)) != len(retired): out.append("an id is retired twice")
    if not isinstance(entries, list): return out + ["entries is a list"]
    for e in entries: out += entry_problems(e, themes, root)
    if out: return out
    if len(entries) > CAP:
        out.append(f"{len(entries)} entries, past the cap of {CAP}: an answer leaves before another enters (retire one first)")
    ids = [e["id"] for e in entries]
    for i in sorted({i for i in ids if ids.count(i) > 1}): out.append(f"{i} is open twice")
    for i in ids:
        if i in retired: out.append(f"{i} was used before (it is retired), and an id is never used again")
    # Questions first, in the order the record gave them; then the calls, grouped in the themes' order.
    order = [(0, 0) if e["kind"] == "question" else (1, themes.index(e["theme"])) for e in entries]
    if order != sorted(order): out.append("the questions come first, then the calls grouped in the themes' order")
    return out


def dump(value, col=0, indent=0, trailing=0):
    """JSON as prettier prints it: objects open, a list of plain values on one line only when the line fits."""
    pad = "  " * indent
    if isinstance(value, dict):
        if not value: return "{}"
        keys = list(value)
        rows = []
        for n, k in enumerate(keys):
            head = f"{pad}  {json.dumps(k, ensure_ascii=False)}: "
            rows.append(head + dump(value[k], len(head), indent + 1, 1 if n < len(keys) - 1 else 0))
        return "{\n" + ",\n".join(rows) + f"\n{pad}}}"
    if isinstance(value, list):
        if not value: return "[]"
        if all(not isinstance(v, (dict, list)) for v in value):
            inline = "[" + ", ".join(json.dumps(v, ensure_ascii=False) for v in value) + "]"
            if col + len(inline) + trailing <= PRINT_WIDTH: return inline
        rows = [f"{pad}  " + dump(v, len(pad) + 2, indent + 1, 1 if n < len(value) - 1 else 0) for n, v in enumerate(value)]
        return "[\n" + ",\n".join(rows) + f"\n{pad}]"
    return json.dumps(value, ensure_ascii=False)


def natural(i):
    m = re.match(r"^([A-Z]+)(\d+)$", i)
    return (len(m.group(1)), m.group(1), int(m.group(2))) if m else (9, i, 0)


def place(entries, e, themes):
    """Where a new entry lands: a question after the last question, a call at the end of its theme's calls."""
    if e["kind"] == "question":
        at = max((n + 1 for n, x in enumerate(entries) if x["kind"] == "question"), default=0)
    else:
        rank = themes.index(e["theme"]) if e["theme"] in themes else len(themes)
        before = [n + 1 for n, x in enumerate(entries) if x["kind"] == "question"
                  or (x["kind"] == "call" and x["theme"] in themes and themes.index(x["theme"]) <= rank)]
        at = max(before, default=0)
    entries.insert(at, e)


def main(argv):
    root = pathlib.Path(".")
    if "--root" in argv:
        i = argv.index("--root")
        if i + 1 >= len(argv): sys.exit(__doc__)
        root = pathlib.Path(argv[i + 1]); argv = argv[:i] + argv[i + 2:]
    if not argv or argv[0] not in ("add", "retire", "check"): sys.exit(__doc__)
    path = root / "docs" / "calls.json"
    try: data = json.loads(path.read_text())
    except (OSError, ValueError) as err: sys.exit(f"calls.py: cannot read {path}: {err}")
    if not (isinstance(data, dict) and isinstance(data.get("entries"), list) and isinstance(data.get("retired"), list)
            and all(isinstance(e, dict) for e in data["entries"])) and argv[0] != "check":
        sys.exit(f'calls.py refused, nothing written: {path} is not {{"themes", "entries", "retired"}}')
    before = problems(data, root)
    # A retire may be what mends a file over its cap, so only an add needs the file whole first.
    if before and argv[0] == "add":
        sys.exit("calls.py refused, nothing written: the file already breaks a rule (fix it first):\n  " + "\n  ".join(before))
    if argv[0] == "check":
        if before: sys.exit(f"{path}: {len(before)} problem{'s' if len(before) != 1 else ''}:\n  " + "\n  ".join(before))
        q = sum(1 for e in data["entries"] if e["kind"] == "question")
        print(f"{path}: {len(data['entries'])} of {CAP} ({q} questions, {len(data['entries']) - q} calls), "
              f"{len(data['retired'])} ids retired; every rule holds")
        return
    if argv[0] == "add":
        if len(argv) != 2: sys.exit(__doc__)
        try: new = json.loads(pathlib.Path(argv[1]).read_text())
        except (OSError, ValueError) as err: sys.exit(f"calls.py: cannot read {argv[1]}: {err}")
        new = new if isinstance(new, list) else [new]
        if not new: sys.exit("calls.py refused, nothing written: no entry to add")
        for e in new:
            mine = entry_problems(e, data["themes"], root)
            if mine: sys.exit("calls.py refused, nothing written:\n  " + "\n  ".join(mine))
            if e["id"] in [x["id"] for x in data["entries"]]: sys.exit(f"calls.py refused, nothing written: {e['id']} is open already")
            if e["id"] in data["retired"]:
                sys.exit(f"calls.py refused, nothing written: {e['id']} was used before (it is retired), and an id is never used again")
            place(data["entries"], e, data["themes"])
        after = problems(data, root)
        if after: sys.exit("calls.py refused, nothing written:\n  " + "\n  ".join(after))
        said = ", ".join(e["id"] for e in new)
    else:
        ids = argv[1:]
        if not ids: sys.exit(__doc__)
        open_ids = [e["id"] for e in data["entries"]]
        for i in ids:
            if i in data["retired"]: sys.exit(f"calls.py refused, nothing written: {i} is retired already")
            if i not in open_ids: sys.exit(f"calls.py refused, nothing written: {i} is not open ({', '.join(open_ids)})")
        if len(set(ids)) != len(ids): sys.exit("calls.py refused, nothing written: an id is named twice")
        data["entries"] = [e for e in data["entries"] if e["id"] not in ids]
        data["retired"] = sorted(data["retired"] + ids, key=natural)
        after = problems(data, root)
        if after: sys.exit("calls.py refused, nothing written:\n  " + "\n  ".join(after))
        said = ", ".join(ids)
    path.write_text(dump(data) + "\n")
    print(f"calls.py: {argv[0]} {said}; {len(data['entries'])} of {CAP} open")


if __name__ == "__main__":
    main(sys.argv[1:])
