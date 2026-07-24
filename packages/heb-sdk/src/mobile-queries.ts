/**
 * Hand-written GraphQL documents for the mobile host.
 *
 * Most operations reach the API as persisted-query hashes captured from a real
 * client. That only works while the hash is present in H-E-B's APQ cache, and
 * it fails outright when we hold a hash for the wrong host — the web hash for
 * `getShoppingListsV2` is not registered on the mobile endpoint, so a bearer
 * session got `PersistedQueryNotFound` every single time.
 *
 * The mobile host does accept full query documents, so for these operations we
 * send the document instead of a hash. That removes the dependency on H-E-B's
 * cache entirely (the captured mobile hash for `GetShoppingListsV2` only
 * resolved on roughly 2 of 5 attempts when it resolved at all).
 *
 * Field selections here were verified against the live mobile schema. Note the
 * inline fragments: these root fields are declared as unions, so selecting
 * fields directly on the union type is a validation error.
 *
 * @module mobile-queries
 */

export interface MobileQueryDocument {
  /** Operation name to send alongside the document. */
  operationName: string;
  /** Full GraphQL document text. */
  query: string;
}

/**
 * `getShoppingListsV2` returns union `ShoppingListsResponseV2`; the concrete
 * type is `ShoppingListsWithHeaderPageV2`. Selection matches the fields
 * `getShoppingLists()` maps, including the `thisPage`/`nextPage` pagination the
 * captured mobile persisted query omitted.
 */
const GET_SHOPPING_LISTS_V2 = `
query GetShoppingListsV2 {
  getShoppingListsV2 {
    ... on ShoppingListsWithHeaderPageV2 {
      lists {
        id
        name
        totalItemCount
        created
        updated
        fulfillment {
          store {
            storeNumber
            name
          }
        }
      }
      thisPage {
        page
        size
        totalCount
        sort
        sortDirection
      }
      nextPage {
        page
        size
        totalCount
        sort
        sortDirection
      }
    }
  }
}`;

/**
 * `getShoppingListV2` returns union `ShoppingListResponseV2`; the concrete type
 * is `ShoppingListV2`.
 *
 * The mobile `ShoppingListItemV2` is much thinner than its web counterpart — it
 * carries no `product` or `itemPrice` subtree, so product names, prices and
 * stock status are simply unavailable here; `getShoppingList()` leaves those
 * fields undefined on a bearer session. Hydrating them would need a second,
 * per-product lookup, which is not wired up yet.
 */
const GET_SHOPPING_LIST_V2 = `
query GetShoppingListV2($input: GetShoppingListInputV2!) {
  getShoppingListV2(input: $input) {
    ... on ShoppingListV2 {
      id
      name
      description
      metadata {
        role
        shoppingListVisibilityLevel
      }
      fulfillment {
        store {
          storeNumber
          name
        }
      }
      created
      updated
      itemPage {
        items {
          id
          checked
          quantity
          note
          weight
          maximumQuantity
          groupHeader
          created
          updated
        }
      }
    }
  }
}`;

/**
 * Operations to send as documents rather than hashes, keyed by the operation
 * name callers pass to `persistedQuery()`. Bearer (mobile) sessions only.
 */
export const MOBILE_QUERY_DOCUMENTS = {
  getShoppingListsV2: {
    operationName: 'GetShoppingListsV2',
    query: GET_SHOPPING_LISTS_V2,
  },
  getShoppingListV2: {
    operationName: 'GetShoppingListV2',
    query: GET_SHOPPING_LIST_V2,
  },
} as const satisfies Record<string, MobileQueryDocument>;
