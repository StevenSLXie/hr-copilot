import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

type Props = {
  amount: number;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: (errorMessage: string) => void;
};

const CheckoutForm : React.FC<Props> = ({ amount, onPaymentSuccess, onPaymentFailure }) => {
  const stripe = useStripe();
  const payAmount = amount;
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
        onPaymentFailure?.(result.error.message);
      } else {
        console.log('Payment successful, amount charged is: ', amount, ' dollars');
        onPaymentSuccess?.();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-between items-center">
        <CardElement className='mt-6 w-1/2 ml-4' />
        <button type="submit" disabled={!stripe} className="bg-blue-400 hover:bg-blue-600 text-white py-2 px-4 rounded mt-4 sm:w-auto mr-10">
        Pay {payAmount} USD to get full data
        </button>
    </form>
  );
};

export default CheckoutForm;