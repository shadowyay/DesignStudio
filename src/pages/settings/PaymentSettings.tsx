import React, { useState } from 'react';

const PaymentSettings = () => {
  const [cards, setCards] = useState([
    { id: 1, last4: '4242', brand: 'Visa', expMonth: 12, expYear: 2024 }
  ]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would integrate with a payment processor here
    const mockCard = {
      id: cards.length + 1,
      last4: newCard.number.slice(-4),
      brand: 'Visa',
      expMonth: parseInt(newCard.expMonth),
      expYear: parseInt(newCard.expYear)
    };
    
    setCards([...cards, mockCard]);
    setShowAddCard(false);
    setNewCard({ number: '', expMonth: '', expYear: '', cvc: '' });
  };

  const handleRemoveCard = (cardId: number) => {
    setCards(cards.filter(card => card.id !== cardId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Saved Payment Methods</h2>

          {cards.length === 0 ? (
            <p className="text-gray-500">No payment methods saved yet.</p>
          ) : (
            <div className="space-y-4">
              {cards.map(card => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {/* Card icon would go here */}
                    <div>
                      <p className="font-medium">
                        {card.brand} ending in {card.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {card.expMonth}/{card.expYear}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCard(card.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showAddCard && (
            <button
              onClick={() => setShowAddCard(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Payment Method
            </button>
          )}
        </div>

        {showAddCard && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Card</h2>
            
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Card Number</label>
                <input
                  type="text"
                  value={newCard.number}
                  onChange={e => setNewCard({...newCard, number: e.target.value})}
                  placeholder="4242 4242 4242 4242"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  maxLength={16}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiration Month</label>
                  <input
                    type="text"
                    value={newCard.expMonth}
                    onChange={e => setNewCard({...newCard, expMonth: e.target.value})}
                    placeholder="MM"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    maxLength={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiration Year</label>
                  <input
                    type="text"
                    value={newCard.expYear}
                    onChange={e => setNewCard({...newCard, expYear: e.target.value})}
                    placeholder="YYYY"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    maxLength={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">CVC</label>
                  <input
                    type="text"
                    value={newCard.cvc}
                    onChange={e => setNewCard({...newCard, cvc: e.target.value})}
                    placeholder="123"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;