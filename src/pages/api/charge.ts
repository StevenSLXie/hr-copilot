import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { payment_method_id, amount } = req.body;
  console.log('payment_method_id', payment_method_id);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      payment_method: payment_method_id,
      amount: amount,
      currency: 'usd',
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${req.headers.origin}`,
    });
    res.json({ id: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message  });
  }
};