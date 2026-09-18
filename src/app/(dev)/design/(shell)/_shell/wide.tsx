/**
 * A wide page (a board, a tool with a 1440 canvas): sets `data-lab-wide`, which
 * design.css reads to hide the table-of-contents column, honour the
 * `sidebar: "collapsed"` preference and lift the content's max-width at 1:1.
 * A plain attribute, so a server page can use it and the layout needs no
 * state to know.
 */
export function WidePage({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-lab-wide
      className="board-page mx-auto w-full max-w-5xl px-4 pb-20"
    >
      {children}
    </div>
  );
}
