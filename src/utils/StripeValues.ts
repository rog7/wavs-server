export const priceId =
  process.env.NODE_ENV == "development"
    ? "price_1O9pvrEClFg6JFP39RVrrD9a"
    : "price_1O9pRAEClFg6JFP3Gpm5SvrD";
export const stripeSecretKey =
  process.env.NODE_ENV == "development"
    ? process.env.DEV_STRIPE_API_KEY
    : process.env.PROD_STRIPE_API_KEY;
