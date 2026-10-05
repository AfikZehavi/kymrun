// ─── Shopify Storefront API (2025-07) ────────────────────────────────────────
// The Storefront Access Token is a publishable token — safe for client bundles.

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN =
  "kymrun-01g25-8ed07gjd.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "0f1b6bfee0aa5133ff544b70dd943912";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShopifyVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    tags: string[];
    productType: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    compareAtPriceRange: {
      minVariantPrice: { amount: string; currencyCode: string };
    };
    images: {
      edges: { node: { url: string; altText: string | null } }[];
    };
    variants: { edges: { node: ShopifyVariant }[] };
    options: { name: string; values: string[] }[];
  };
}

// ─── Storefront API request helper ──────────────────────────────────────────

export async function storefrontApiRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | undefined> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) return undefined;
  if (!response.ok) throw new Error(`Shopify HTTP ${response.status}`);

  const data = (await response.json()) as { errors?: unknown; data?: T };
  if (data.errors) throw new Error("Shopify GraphQL error");
  return data.data;
}

// ─── Products ────────────────────────────────────────────────────────────────

export const PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
          id
          title
          description
          handle
          tags
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      tags
      productType
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
    }
  }
`;

// ─── Cart mutations ──────────────────────────────────────────────────────────

const CART_QUERY = /* GraphQL */ `
  query cart($id: ID!) {
    cart(id: $id) {
      id
      totalQuantity
    }
  }
`;

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              merchandise {
                ... on ProductVariant {
                  id
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) {
          edges {
            node {
              id
              merchandise {
                ... on ProductVariant {
                  id
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type ShopifyUserError = { field: string[] | null; message: string };

function formatCheckoutUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("channel", "online_store");
    return u.toString();
  } catch {
    return url;
  }
}

function isCartNotFound(errors: ShopifyUserError[]): boolean {
  return errors.some((e) => {
    const m = e.message.toLowerCase();
    return m.includes("cart not found") || m.includes("does not exist");
  });
}

export async function createShopifyCart(
  variantId: string,
  quantity: number,
): Promise<{ cartId: string; checkoutUrl: string; lineId: string } | null> {
  const data = await storefrontApiRequest<{
    cartCreate: {
      cart: {
        id: string;
        checkoutUrl: string;
        lines: {
          edges: { node: { id: string; merchandise: { id: string } } }[];
        };
      } | null;
      userErrors: ShopifyUserError[];
    };
  }>(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity, merchandiseId: variantId }] },
  });
  if (!data) return null;

  const errors = data.cartCreate?.userErrors ?? [];
  if (errors.length > 0) {
    console.error("Shopify cartCreate failed:", errors);
    return null;
  }

  const cart = data.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const lineId = cart.lines.edges[0]?.node?.id;
  if (!lineId) return null;

  return {
    cartId: cart.id,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
    lineId,
  };
}

export async function addLineToShopifyCart(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<{ success: boolean; lineId?: string | undefined; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest<{
    cartLinesAdd: {
      cart: {
        lines: {
          edges: { node: { id: string; merchandise: { id: string } } }[];
        };
      } | null;
      userErrors: ShopifyUserError[];
    };
  }>(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity, merchandiseId: variantId }],
  });
  if (!data) return { success: false };

  const errors = data.cartLinesAdd?.userErrors ?? [];
  if (isCartNotFound(errors)) return { success: false, cartNotFound: true };
  if (errors.length > 0) {
    console.error("Shopify cartLinesAdd failed:", errors);
    return { success: false };
  }

  const edges = data.cartLinesAdd?.cart?.lines?.edges ?? [];
  const line = edges.find(
    (l) => l.node.merchandise.id === variantId,
  );
  return { success: true, lineId: line?.node?.id ?? undefined };
}

export async function updateShopifyCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest<{
    cartLinesUpdate: {
      cart: { id: string } | null;
      userErrors: ShopifyUserError[];
    };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  if (!data) return { success: false };

  const errors = data.cartLinesUpdate?.userErrors ?? [];
  if (isCartNotFound(errors)) return { success: false, cartNotFound: true };
  if (errors.length > 0) {
    console.error("Shopify cartLinesUpdate failed:", errors);
    return { success: false };
  }
  return { success: true };
}

export async function removeLineFromShopifyCart(
  cartId: string,
  lineId: string,
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest<{
    cartLinesRemove: {
      cart: { id: string } | null;
      userErrors: ShopifyUserError[];
    };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds: [lineId] });
  if (!data) return { success: false };

  const errors = data.cartLinesRemove?.userErrors ?? [];
  if (isCartNotFound(errors)) return { success: false, cartNotFound: true };
  if (errors.length > 0) {
    console.error("Shopify cartLinesRemove failed:", errors);
    return { success: false };
  }
  return { success: true };
}

export async function syncShopifyCart(
  cartId: string,
): Promise<{ exists: boolean; totalQuantity: number } | null> {
  const data = await storefrontApiRequest<{
    cart: { id: string; totalQuantity: number } | null;
  }>(CART_QUERY, { id: cartId });
  if (!data) return null;
  return {
    exists: Boolean(data.cart),
    totalQuantity: data.cart?.totalQuantity ?? 0,
  };
}
