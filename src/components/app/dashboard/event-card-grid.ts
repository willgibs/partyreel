/**
 * THE EVENT CARDS' GRID, in its one home: the dashboard's cards and the dashboard's loading
 * skeleton read the same columns, so the skeleton never promises a grid the page does not draw.
 *
 * ★ WIDE WINDOWS GET MORE CARDS, NOT BIGGER ONES (his `album-columns` note: the host dash "should
 * go wide the same way" as the album). The dashboard runs to the window's edges, so the columns
 * grow with it and a card stays about 300 to 430px wide, the size its 16:10 cover and its overlay
 * chips were drawn for: two on a tablet, three at a laptop, four from 1280, five past 1800 and
 * six on a 2560 screen.
 */
export const EVENT_CARD_GRID =
  "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-5 min-[2300px]:grid-cols-6";
