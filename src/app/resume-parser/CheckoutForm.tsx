import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

type Props = {
  amount: number;
};

const CheckoutForm : React.FC<Props> = ({ amount }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement!,
    });

    if (error) {
      console.error(error);
    } else {
      const response = await fetch('/api/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod!.id,
          amount: 100 * amount, // amount in cents
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.error(result.error.message);
      } else {
        console.log('Payment successful!');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <CardElement className="mb-4 p-2 border-2 border-gray-300 rounded" />
        <button type="submit" disabled={!stripe} className="btn">
        Donate
        </button>
    </form>
  );
};

export default CheckoutForm;