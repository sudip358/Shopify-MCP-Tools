import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";

// Input schema for updateProduct
const UpdateProductInputSchema = z.object({
  productId: z.string().min(1).describe("The GID of the product to update (e.g., \"gid://shopify/Product/1234567890\")"),
  title: z.string().optional().describe("The new title for the product"),
  descriptionHtml: z.string().optional().describe("The new HTML description for the product")
});

type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

// Will be initialized in index.ts
let shopifyClient: GraphQLClient;

/**
 * Tool for updating product details including SEO-relevant fields
 * @returns {Object} Updated product details
 */
const updateProduct = {
  name: "update-product",
  description: "Update a product's details including title and description",
  schema: UpdateProductInputSchema,

  // Add initialize method to set up the GraphQL client
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: UpdateProductInput) => {
    try {
      const { productId, title, descriptionHtml } = input;

      // Only include fields that are provided in the input
      const productInput: any = {};
      if (title !== undefined) productInput.title = title;
      if (descriptionHtml !== undefined) productInput.descriptionHtml = descriptionHtml;

      const mutation = gql`
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
              descriptionHtml
              handle
              status
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          id: productId,
          ...productInput
        }
      };

      const data = (await shopifyClient.request(mutation, variables)) as {
        productUpdate: {
          product: {
            id: string;
            title: string;
            descriptionHtml: string;
            handle: string;
            status: string;
            updatedAt: string;
          };
          userErrors: Array<{
            field: string;
            message: string;
          }>;
        };
      };

      if (data.productUpdate.userErrors.length > 0) {
        throw new Error(
          `Failed to update product: ${data.productUpdate.userErrors
            .map((error) => error.message)
            .join(", ")}`
        );
      }

      return {
        product: data.productUpdate.product
      };
    } catch (error) {
      console.error("Error updating product:", error);
      throw new Error(
        `Failed to update product: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
};

export { updateProduct }; 