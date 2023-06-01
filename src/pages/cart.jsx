import * as React from "react"
import { Link } from "gatsby"
import { Layout } from "../components/layout"
import { StoreContext } from "../context/store-context"
import { LineItem } from "../components/line-item"
import { formatPrice } from "../utils/format-price"
import {
  table,
  wrap,
  totals,
  grandTotal,
  summary,
  checkoutButton,
  collapseColumn,
  labelColumn,
  imageHeader,
  productHeader,
  emptyStateContainer,
  emptyStateHeading,
  emptyStateLink,
  title,
} from "./cart.module.css"
import { Seo } from "../components/seo"

export default function CartPage() {
  const { checkout, loading, client, setCheckout } = React.useContext(StoreContext)
  const emptyCart = checkout.lineItems.length === 0

  const handleCheckout = async () => {
    if(window.onwardApp) {
      await window.onwardApp.updateCartForCheckout();
    }
    window.open(checkout.webUrl)
  }

  const parseCheckout = (checkout) => {
    return {
      currency: checkout.currencyCode || null,
      items: checkout.lineItems.map(item =>
        ({
          id: item.id,
          cost: { amount: Number(item.variant.price.amount) * item.quantity, currencyCode: item.variant.price.currencyCode },
          quantity: item.quantity,
          properties: null,
          variant: {
            price: null,
            requiresShipping: true,
            id: item.variant.id,
          }
        })
      )
    };
  };

  React.useEffect(() => {
    if(window.onwardApp) {
      window.onwardApp.cartChanged(parseCheckout(checkout));
    }
  }, [checkout]);

  React.useEffect(() => {
    const storefrontClient = {
      fetchInsuranceProduct: async function(){
        return await client.product.fetchByHandle('onward-package-protection').then((product) => {
          return {
            variants: product.variants.map(variant =>
              ({
                id: variant.id,
                price: { amount: Number(variant.price.amount), currencyCode: variant.price.currencyCode }
              })
            )
          };
        });
      },
      fetchCart: async function(){
        return await client.checkout.fetch(checkout.id).then(parseCheckout);
      },
      clearCart: async function() {
        // clearCart(): Promise<Cart>;
        return await client.checkout.removeLineItems(checkout.id, checkout.lineItems.map(item => item.id)).then(parseCheckout);
      },
      updateCartLines: async function(changes) {
        // updateCartQuantities(changes: Record<string, number>): Promise<Cart>;
        const response = await client.checkout.updateLineItems(
          checkout.id,
          changes.map(({ id, quantity }) => {
            return {
              id,
              quantity,
            };
          }),
        );

        setCheckout(response);

        return parseCheckout(response);
      },
      addCartLines: async function(changes) {
        // applyCartLineChanges(changes: CartLineChange[]): Promise<Cart>;
        return parseCheckout(await client.checkout.addLineItems(
          checkout.id,
          changes.map(({ variantId, quantity }) => {
            return {
              variantId,
              quantity,
            };
          }),
        ));
      },
    };

    window.initializeOnward({
      storefrontClient,
      containerSelector: '#onward-container',
      force: true,
      locale: {
        currency_iso_code: 'EUR',
        request_locale: 'fr-FR',
      }
    });
  });

  return (
    <Layout>
      <div className={wrap}>
        {emptyCart ? (
          <div className={emptyStateContainer}>
            <h1 className={emptyStateHeading}>Your cart is empty</h1>
            <p>
              Looks like you haven’t found anything yet. We understand that
              sometimes it’s hard to choose — maybe this helps:
            </p>
            <Link to="/search?s=BEST_SELLING" className={emptyStateLink}>
              View trending products
            </Link>
          </div>
        ) : (
          <>
            <h1 className={title}>Your cart</h1>
            <table className={table}>
              <thead>
                <tr>
                  <th className={imageHeader}>Image</th>
                  <th className={productHeader}>Product</th>
                  <th className={collapseColumn}>Price</th>
                  <th>Qty.</th>
                  <th className={[totals, collapseColumn].join(" ")}>Total</th>
                </tr>
              </thead>
              <tbody>
                {checkout.lineItems.map((item) => (
                  <LineItem item={item} key={item.id} />
                ))}

                <tr>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td>
                    <div id="onward-container"></div>
                  </td>
                </tr>

                <tr className={summary}>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={labelColumn}>Subtotal</td>
                  <td className={totals}>
                    {formatPrice(
                      checkout.subtotalPriceV2.currencyCode,
                      checkout.subtotalPriceV2.amount
                    )}
                  </td>
                </tr>
                <tr className={summary}>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={labelColumn}>Taxes</td>
                  <td className={totals}>
                    {formatPrice(
                      checkout.totalTaxV2.currencyCode,
                      checkout.totalTaxV2.amount
                    )}
                  </td>
                </tr>
                <tr className={summary}>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={labelColumn}>Shipping</td>
                  <td className={totals}>Calculated at checkout</td>
                </tr>
                <tr className={grandTotal}>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={collapseColumn}></td>
                  <td className={labelColumn}>Total Price</td>
                  <td className={totals}>
                    {formatPrice(
                      checkout.totalPriceV2.currencyCode,
                      checkout.totalPriceV2.amount
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className={checkoutButton}
            >
              Checkout
            </button>
          </>
        )}
      </div>
    </Layout>
  )
}

export const Head = () => <Seo />
