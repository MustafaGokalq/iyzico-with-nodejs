const { v4: uuidv4 } = require("uuid");
const Iyzipay = require("iyzipay");
const Response = require("../../utils/response");
const APIError = require("../../utils/errors");
const payment = require("./model");

const AddPayment = async (req, res) => {
  const id = uuidv4();
  const {
    price,
    cardUserName,
    cardNumber,
    expireDate,
    cvc,
    registerCard,
    cardToken,
    cardUserKey,
    isSave,
  } = req.body;

  const iyzipay = new Iyzipay({
    apiKey: process.env.PAYMENT_API_KEY,
    secretKey: process.env.PAYMENT_SECRET_KEY,
    uri: "https://sandbox-api.iyzipay.com",
  });

  let data = {
    locale: "tr",
    conversationId: id,
    price,
    paidPrice: price,
    currency: "TRY",
    installment: 1,
    paymentChannel: "WEB",
    basketId: id,
    paymentGroup: "PRODUCT",

    buyer: {
      id: "BY789",
      name: "John",
      surname: "Doe",
      identityNumber: "11111111111",
      email: "test@testtt.com",
      gsmNumber: "+905393623333",
      registrationDate: "2013-04-21 15:12:09",
      lastLoginDate: "2015-10-05 12:43:35",
      registrationAddress: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34732",
      ip: "85.34.78.112",
    },
    shippingAddress: {
      address: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
      zipCode: "34742",
      contactName: "Jane Doe",
      city: "Istanbul",
      country: "Turkey",
    },
    billingAddress: {
      address: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
      zipCode: "34742",
      contactName: "Jane Doe",
      city: "Istanbul",
      country: "Turkey",
    },
    basketItems: [
      {
        id: "BI101",
        price: "12",
        name: "Binocular",
        category1: "Collectibles",
        category2: "Accessories",
        itemType: "PHYSICAL",
      },
    ],
  };

  if (isSave === true && cardToken && cardUserKey) {
    data.paymentCard = {
      cardToken,
      cardUserKey,
    };
  } else if (isSave === false) {
    data.paymentCard = {
      cardHolderName: cardUserName,
      cardNumber,
      expireYear: "20" + expireDate.split("/")[1],
      expireMonth: expireDate.split("/")[0],
      cvc,
      registerCard,
    };
  } else {
    throw new APIError("Lütfen geçerli bir ödeme yöntemi seçiniz");
  }

  //   iyzipay.payment.create(data, function(err, result) {
  //     if (err) {
  //       new Response(null, "Ödeme işlemi başarısız")
  //     }

  //     new Response(result, "Ödeme başarılı").success(res);
  //   });

  return new Promise(async (resolve, reject) => {
    iyzipay.payment.create(data, async function (err, result) {
      if (err)
        return reject({
          custom: true,
          status: 400,
          message: result.errorMessage || err.message,
        });
      console.log(err, result);

      const saveData = new payment({
        sendData: data,
        resultData: result,
      });

      await saveData.save().catch((err) => console.log(err));

      if (result.status !== "success") {
        return reject({
          custom: true,
          status: 400,
          message: result.errorMessage,
        });
      }

      return resolve(new Response(result, "işlem başarılı").success(res));
    });
  });
};

const cardList = async (req, res) => {
  const { cardUserKey } = req.body;

  const iyzipay = new Iyzipay({
    apiKey: process.env.PAYMENT_API_KEY,
    secretKey: process.env.PAYMENT_SECRET_KEY,
    uri: "https://sandbox-api.iyzipay.com",
  });

  return new Promise(async (resolve, reject) => {
    iyzipay.cardList.retrieve(
      {
        cardUserKey,
      },
      async function (err, result) {
        if (err)
          return reject({
            custom: true,
            status: 400,
            message: result.errorMessage || err.message,
          });
        console.log(err, result);

        if (result.status !== "success") {
          return reject({
            custom: true,
            status: 400,
            message: result.errorMessage,
          });
        }

        result.cardDetails.map((item) => {
          item.cardUserKey = cardUserKey;
        });

        return resolve(new Response(result.cardDetails, "Kayıtlı Kartlar").success(res));
      }
    );
  });
};

const cardSave = async (req, res) => {
  const { cardUserName, cardNumber, expireDate, email, cardAlias, cardUserKey } = req.body;
  const iyzipay = new Iyzipay({
    apiKey: process.env.PAYMENT_API_KEY,
    secretKey: process.env.PAYMENT_SECRET_KEY,
    uri: "https://sandbox-api.iyzipay.com",
  });

  const data = {
    locales: "tr",
    email,
    cardUserKey,
    externalId:"external Id",
    card: {
      cardHolderName: cardUserName,
      cardNumber,
      cardAlias,
      expireYear: "20" + expireDate.split("/")[1],
      expireMonth: expireDate.split("/")[0],
    },
  };

  return new Promise(async (resolve, reject) => {
    iyzipay.card.create(data, async function (err, result) {
        if (err)
          return reject({
            custom: true,
            status: 400,
            message: result.errorMessage || err.message,
          });
        console.log(err, result);

        if (result.status !== "success") {
          return reject({
            custom: true,
            status: 400,
            message: result.errorMessage,
          });
        }

        return resolve(new Response(result, "card kaydedildi").success(res));
      }
    );
  });
};


const cardDelete = async(req,res)=>{
  const {cardToken, cardUserKey} = req.body;
  const iyzipay = new Iyzipay({
    apiKey: process.env.PAYMENT_API_KEY,
    secretKey: process.env.PAYMENT_SECRET_KEY,
    uri: "https://sandbox-api.iyzipay.com",
  });

  return new Promise(async (resolve, reject) => {
    iyzipay.card.delete({
      "locale":"tr",
      cardToken,
      cardUserKey
    }, async function (err, result) {
        if (err)
          return reject({
            custom: true,
            status: 400,
            message: result.errorMessage || err.message,
          });
        console.log(err, result);

        if (result.status !== "success") {
          return reject({
            custom: true,
            status: 400,
            message: result.errorMessage,
          });
        }

        return resolve(new Response(result, "card silindi").success(res));
      }
    );
  });

}

module.exports = {
  AddPayment,
  cardList,
  cardSave,
  cardDelete
};
