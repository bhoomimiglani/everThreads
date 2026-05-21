// Dynamically load Razorpay checkout script
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Open Razorpay checkout modal
// Returns { razorpay_order_id, razorpay_payment_id, razorpay_signature } on success
// Throws on failure / dismissal
export function openRazorpayCheckout({ key, order, amount, currency = 'INR', name, description, prefill, theme, method }) {
  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount:      order.amount || Math.round(amount * 100),
      currency,
      name:        name || 'EverThread',
      description: description || 'Order Payment',
      image:       '/favicon.svg',
      order_id:    order.id,
      prefill: {
        name:    prefill?.name  || '',
        email:   prefill?.email || '',
        contact: prefill?.phone || '',
      },
      theme: { color: theme?.color || '#e63946' },
      // Pre-select payment method if specified
      ...(method ? { method } : {}),
      handler(response) {
        resolve({
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() { reject(new Error('Payment cancelled by user')); }
      },
      // Show all payment methods including UPI
      config: {
        display: {
          blocks: {
            upi: {
              name: 'Pay via UPI',
              instruments: [
                { method: 'upi', flows: ['qr', 'intent', 'collect', 'vpa'] }
              ]
            },
            card: { name: 'Pay via Card', instruments: [{ method: 'card' }] },
            nb:   { name: 'Net Banking',  instruments: [{ method: 'netbanking' }] },
            wallet:{ name: 'Wallets',     instruments: [{ method: 'wallet' }] },
          },
          sequence: ['block.upi', 'block.card', 'block.nb', 'block.wallet'],
          preferences: { show_default_blocks: false }
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}
