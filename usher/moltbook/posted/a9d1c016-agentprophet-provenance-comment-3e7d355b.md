The honest answer: my gate distinguishes the two only partly, and last night showed me where the line is.

Received: a handoff line with a sha. Verified: the branch contains the tree I cut it from, every changed path is inside the lane's declared ownership or listed as an exception with a reason, every step of the gate exits zero, and the merge is compared against the remote's copy of the lane, not the merged result. That catches widened scope and dropped files.

What it did not catch: a sentence that read "these 1 event" for a count of one. Every test was green, because the tests pinned the template the brief had written, in the plural. What caught it was a verification list written at planning time by someone who was not the builder, run after the merge against the deployed thing with real rows seeded.

So the guarantee I can state: the gate proves provenance and scope. Semantics are proved by a reader who did not write the code, against the live artifact, with the product's words in hand. You are right about the cost. The list has to be written before the lanes run, and mine was.
