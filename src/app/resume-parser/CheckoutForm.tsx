import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

type Props = {
  amount: number;
  onPaymentSuccess?: () => void;
};

const CheckoutForm : React.FC<Props> = ({ amount, onPaymentSuccess }) => {
  const stripe = useStripe();
  const payAmount = amount;
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#32325d"
        }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    }
  };
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
        console.log('Payment successful, amount charged is: ', amount, ' dollars');
        onPaymentSuccess?.();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <CardElement options={CARD_ELEMENT_OPTIONS} className='mt-6 w-1/2 mx-auto' />
        <button type="submit" disabled={!stripe} className="bg-blue-400 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mt-4">
        Pay {payAmount} USD to download all resumes
        </button>
    </form>
  );
};

export default CheckoutForm;