# How this works

Trade back and forth on two currencies by placing a greedy buy/sell price. E.g. buy ETH with XRP at a price 2% below market and sell ETH at a price 2% above your purchase price. *Assuming both currencies will one day be worth more than at time of original purchase*, you will net a positive return.

The divisor is used to divide your pool of currency into multiple orders so that you can "ride the lows" since it may take days for orders to cross over your buy price.

# Build and Run

Be sure to add your Binance api keys to main.js

1. `npm install`
2. `node main.js`
