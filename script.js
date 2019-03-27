$(document).ready(function () {

    waitForTableToBeFilledAndCalculate();

});

$( document ).ajaxComplete(function() {
    alert( "Triggered ajaxComplete handler." );
});

function listenForChangesAndReCalculate() {
    $("tbody").one("DOMSubtreeModified", function () {
        setTimeout(function () {
            calculate();
        }, 100);
        setTimeout(function () {
            listenForChangesAndReCalculate();
        }, 500);
    });
}

function waitForTableToBeFilledAndCalculate() {
    setTimeout(function () {
        if (isTableEmpty()) {
            waitForTableToBeFilledAndCalculate();
        } else {
            calculate();
            listenForChangesAndReCalculate();
        }
    }, 500)
}

function isTableEmpty() {
    return $("td.ng-binding").text() == "";
}

const PAIR_NAME_INDEX = 1;
const TYPE_INDEX = 2;
const PRICE_INDEX = 3;
const QUANTITY_INDEX = 4;
const TOTAL_PRICE_INDEX = 6;

function getTextFromColumn(element, index) {
    return $(element).find('td').eq(index).text();
}

function calculate() {

    let pairsAndPrices = extractData();
    clearOldBlockAndStartNew();
    fillBlock(pairsAndPrices);


    function getPair(pairsAndPrices, pair) {
        let pairAndPrices = pairsAndPrices.get(pair);
        if (pairAndPrices === undefined) {
            pairAndPrices = {
                name: pair, buyPrice: 0, buyQuantity: 0, buyTotalPrice: 0,
                sellPrice: 0, sellQuantity: 0, sellTotalPrice: 0
            };
            pairsAndPrices.set(pair, pairAndPrices);
        }
        return pairAndPrices;
    }

    function fillBlock(pairsAndPrices) {
        let toPrepend = '';
        pairsAndPrices.forEach(function (value, key) {
            let profit = value.sellTotalPrice - value.buyTotalPrice;
            toPrepend += '<tr class="appended"><td>' + key + '</td>' +
                '<td>' + getProfitEntry(profit) + '</td>' +
                '<td>' + formatPrice(value.buyPrice) + '<br />' + formatPrice(value.sellPrice) + '</td>' +
                '<td>' + formatQuantity(value.buyQuantity) + '<br />' + formatQuantity(value.sellQuantity) + '</td>' +
                '<td>' + formatPrice(value.buyTotalPrice) + '<br />' + formatPrice(value.sellTotalPrice) + '</td>' +
                '<td colspan="2">' + formatPrice(profit) + ' </td>' +
                '</tr>';
        });
        $('.table > tbody').prepend(toPrepend);
    }

    function clearOldBlockAndStartNew() {
        if (pairsAndPrices.size > 0) {
            $('.appended').each(function () {
                $(this).remove()
            });
            $('.table > tbody').prepend('<tr class="appended"><td colspan="7"></td></tr>');
        }
    }

    function extractData() {
        let pairsAndPrices = new Map();
        $("tr.ng-scope").each(function () {
            let pair = getTextFromColumn($(this), PAIR_NAME_INDEX);
            let pairAndPrices = getPair(pairsAndPrices, pair);
            let type = getTextFromColumn($(this), TYPE_INDEX);
            let quantity = parseFloat(getTextFromColumn($(this), QUANTITY_INDEX));
            let price = parseFloat(getTextFromColumn($(this), PRICE_INDEX));
            let totalPrice = parseFloat(getTextFromColumn($(this), TOTAL_PRICE_INDEX));
            if (isBuy(type)) {
                let newQuantity = pairAndPrices.buyQuantity + quantity;
                let newBuyPrice = (pairAndPrices.buyPrice * pairAndPrices.buyQuantity + price * quantity) / newQuantity;
                pairAndPrices.buyPrice = newBuyPrice;
                pairAndPrices.buyQuantity = newQuantity;
                pairAndPrices.buyTotalPrice += totalPrice;
            } else {
                let newQuantity = pairAndPrices.sellQuantity + quantity;
                let newSellPrice = (pairAndPrices.sellPrice * pairAndPrices.sellQuantity + price * quantity) / newQuantity;
                pairAndPrices.sellPrice = newSellPrice;
                pairAndPrices.sellQuantity = newQuantity;
                pairAndPrices.sellTotalPrice += totalPrice;
            }
        });
        return pairsAndPrices;
    }
}

function isBuy(type) {
    return "Buy" === type;
}

function isProfit(profitNumeric) {
    return profitNumeric > 0;
}

function getProfitLabel(isProfit) {
    return isProfit ? 'Profit' : 'Loss';
}

function getProfitEntry(profit) {
    let isProfit = profit > 0;
    let color = isProfit ? "green" : "magenta";
    return '<span class="' + color + ' ng-binding ng-scope">' + getProfitLabel(isProfit) + '</span>';
}

function formatQuantity(quantity) {
    return quantity.toFixed(2);
}

function formatPrice(quantity) {
    return quantity.toFixed(8);
}