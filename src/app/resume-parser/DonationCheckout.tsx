import { useEffect, useState } from 'react';
import getStripe from '../../utils/get-stripejs';
import { Stripe } from '@stripe/stripe-js';

const CheckoutButton = () => {
  const [stripe, setStripe] = useState<Stripe | null>(null);

    useEffect(() => {
        async function fetchStripe() {
        const stripeInstance = await getStripe();
        setStripe(stripeInstance);
        }

        fetchStripe();
    }, []);

  const handleClick = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1000, // amount in cents
      }),
    });

    const session = await response.json();

    if (stripe) {
        const result = await (stripe as any).redirectToCheckout({
            sessionId: session.id,
        });

        if (result.error) {
            console.error(result.error.message);
        }
    }
  };

  return (
    <button role="link" onClick={handleClick}>
      Donate
    </button>
  );
};

export default CheckoutButton;