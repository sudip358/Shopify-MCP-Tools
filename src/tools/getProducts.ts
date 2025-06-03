import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";

// Input schema for getProducts
const GetProductsInputSchema = z.object({
  searchTitle: z.string().optional().describe("Optional search term to filter products by title"),
  limit: z.number().default(10).describe("Maximum number of products to return (default: 10)")
});

type GetProductsInput = z.infer<typeof GetProductsInputSchema>;

// Will be initialized in index.ts
let shopifyClient: GraphQLClient;

/**
 * Tool for fetching multiple products with their details
 * @returns {Object} List of products with their details including SEO-relevant fields
 */
const getProducts = {
  name: "get-products",
  description: "Get all products or search by title, including SEO-relevant fields like title and description",
  schema: GetProductsInputSchema,

  // Add initialize method to set up the GraphQL client
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: GetProductsInput) => {
    try {
      const { searchTitle, limit } = input;

      // Create query based on whether we're searching by title or not
      const query = gql`
        query GetProducts($first: Int!, $query: String) {
          products(first: $first, query: $query) {
            edges {
              node {
                id
                title
                description
                descriptionHtml
                handle
                status
                createdAt
                updatedAt
                totalInventory
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      price
                      inventoryQuantity
                      sku
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const variables = {
        first: limit,
        query: searchTitle ? `title:*${searchTitle}*` : undefined
      };

      const data = (await shopifyClient.request(query, variables)) as {
        products: any;
      };

      // Extract and format product data
      const products = data.products.edges.map((edge: any) => {
        const product = edge.node;

        // Format variants
        const variants = product.variants.edges.map((variantEdge: any) => ({
          id: variantEdge.node.id,
          title: variantEdge.node.title,
          price: variantEdge.node.price,
          inventoryQuantity: variantEdge.node.inventoryQuantity,
          sku: variantEdge.node.sku
        }));

        // Get first image if it exists
        const imageUrl =
          product.images.edges.length > 0
            ? product.images.edges[0].node.url
            : null;

        /**
         * @typedef {Object} Product
         * @property {string} id - The unique GID of the product
         * @property {string} title - The product title, optimized for SEO
         * @property {string} description - The plain text description of the product
         * @property {string} descriptionHtml - The HTML formatted description of the product
         * @property {string} handle - The URL-friendly handle/slug of the product
         * @property {string} status - Current status of the product (e.g., ACTIVE, ARCHIVED)
         * @property {string} createdAt - Product creation timestamp
         * @property {string} updatedAt - Last update timestamp
         * @property {number} totalInventory - Total available inventory across all variants
         */
        return {
          id: product.id,
          title: product.title,
          description: product.description,
          descriptionHtml: product.descriptionHtml,
          handle: product.handle,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          totalInventory: product.totalInventory,
          priceRange: {
            minPrice: {
              amount: product.priceRangeV2.minVariantPrice.amount,
              currencyCode: product.priceRangeV2.minVariantPrice.currencyCode
            },
            maxPrice: {
              amount: product.priceRangeV2.maxVariantPrice.amount,
              currencyCode: product.priceRangeV2.maxVariantPrice.currencyCode
            }
          },
          imageUrl,
          variants
        };
      });

      return { products };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error(
        `Failed to fetch products: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
};

export { getProducts };
