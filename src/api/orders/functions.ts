import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withWorkspace, ownedOrder } from "../../server/context";
export const getOrders = createServerFn({ method: "GET" })
  .validator(z.object({ cursor: z.string().max(1000).optional() }))
  .handler(({ data }) =>
    withWorkspace(({ affinity, practiceId }) =>
      // One page as the API sent it, so it can cross to the browser.
      affinity.orders
        .list({ practiceId, startingAfter: data.cursor, limit: 25 })
        .then((page) => page.response),
    ),
  );
export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().regex(/^ord_[0-7][0-9a-hjkmnp-tv-z]{25}$/) }))
  .handler(({ data }) => withWorkspace((context) => ownedOrder(context, data.orderId)));
