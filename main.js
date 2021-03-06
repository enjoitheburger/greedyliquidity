const binance = require('node-binance-api')
binance.options({
    'APIKEY': '',
	'APISECRET': ''
})

// Config
const CURRENCY1 = 'XRP'
const CURRENCY2 = 'ETH'
const TICKER_SYM = 'XRPETH'
const WAIT_TIME_FOR_BUY_MS = 60000 // wait one minute for a buy order, otherwise assume the market has moved and re-order
const DIVISOR_CONSTANT = 1
const SELL_MARGIN = 1.001
const BUY_MARGIN = 0.9990

binance.websockets.userData(balance_update, execution_update);
buyOrder()

function balance_update(data) {
	//console.log("Balance Update");
	// for ( let obj of data.B ) {
	// 	let { a:asset, f:available, l:onOrder } = obj;
	// 	if ( available == "0.00000000" ) continue;
    //     //console.log(asset+"\tavailable: "+available+" ("+onOrder+" on order)");
	// }
	}
function execution_update(data) {
	let { x:executionType, s:symbol, p:price, q:quantity, S:side, o:orderType, i:orderId, X:orderStatus } = data;
    //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
	console.log(symbol+"\t"+side+" "+executionType+" "+orderType+" ORDER #"+orderId);
    if ( executionType === "NEW" ) {
		if ( orderStatus === "REJECTED" ) {
			console.log("Order Failed! Reason: "+data.r);
		}
		//console.log(symbol+" "+side+" "+orderType+" ORDER #"+orderId+" ("+orderStatus+")");
		//console.log("..price: "+price+", quantity: "+quantity);
		return;
    } else if (executionType === "EXPIRED") {
        // If our order expires, place it again
        if (side === 'BUY') {
            binance.buy(TICKER_SYM, quantity, price)
        } else if (side === 'SELL') {
            binance.sell(TICKER_SYM, quantity, price)
        }
    } else if (executionType == "TRADE") {
        if (side === 'BUY') {
            // Order went through, time to sell relative to our original buy price.
            binance.sell(TICKER_SYM, quantity, (price * SELL_MARGIN).toPrecision(5))
        } else if (side === 'SELL') {
            // Try to place another order
            buyOrder()
        }
    }
	
}

function sellOrder() {
    binance.balance(function(balances) {
        binance.prices(function(ticker) {
            console.log('-----------------SELL ORDER------------------')
            console.log(`${CURRENCY1} balance: `, balances[CURRENCY1].available);
            console.log(`Price of ${TICKER_SYM}: `, ticker[TICKER_SYM]);
            if (balances[CURRENCY1].available > 0) {
                const sellPrice = (ticker[TICKER_SYM]*SELL_MARGIN).toPrecision(5)
                const orderQuantity = Math.floor(balances[CURRENCY1].available/DIVISOR_CONSTANT)
                console.log('Order quantity', orderQuantity)
                console.log('high-ball price', sellPrice)
                binance.sell(TICKER_SYM, orderQuantity, sellPrice);
            }
            console.log('----------------------------------------------')
        })
    });
}

function buyOrder() {
    binance.balance(function(balances) {
        binance.prices(function(ticker) {
            console.log('-----------------BUY ORDER------------------')
            console.log(`${CURRENCY2} balance: `, balances[CURRENCY2].available);
            console.log(`Price of ${TICKER_SYM}: `, ticker[TICKER_SYM]);
            if (balances[CURRENCY2].available > 0) {
                const buyPrice = (ticker[TICKER_SYM]*BUY_MARGIN).toPrecision(5)
                const orderQuantity = Math.floor(balances[CURRENCY2].available/DIVISOR_CONSTANT/buyPrice)
                console.log('Order quantity', orderQuantity)
                console.log('Low-ball price', buyPrice)
                binance.buy(TICKER_SYM, orderQuantity, buyPrice, {}, function(response) {
                    if (response.msg) {
                        //error
                        console.log(`Error: BUY(${TICKER_SYM}, ${orderQuantity}, ${buyPrice}) => ${response.msg}`)
                    } else {
                        const orderId = response.orderId
                        console.debug(`BUY(${TICKER_SYM}, ${orderQuantity}, ${buyPrice}) => Order Id #${orderId}`)
                        setTimeout(() => {
                            binance.orderStatus(TICKER_SYM, orderId, function(orderStatus, symbol) {
                                console.debug(orderId+" order status:", orderStatus);
                                if (orderStatus.status === 'NEW') {
                                    // replace the order, the market has moved
                                    binance.cancel(TICKER_SYM, orderId, function(response, symbol) {
                                        console.debug(orderId +" cancel response:", JSON.stringify(response));
                                        buyOrder()
                                    });
    
                                }
                            });
                        }, WAIT_TIME_FOR_BUY_MS)
                    }
                });
            }
            console.log('----------------------------------------------')
        })
    });
}