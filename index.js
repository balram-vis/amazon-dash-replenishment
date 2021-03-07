var AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
AWS.config.region = "eu-west-1";
var request = require("request");
const dynamo = new AWS.DynamoDB.DocumentClient();
var lambda = new AWS.Lambda({
  region: "eu-west-1",
});
let lambdaNamePreToken = process.env.LAMBDA_TOKEN;
let dbtableNameReg = process.env.TABLE_NAME_REGISTRATION;
let replenishmentId74 = process.env.REPLISHMENT_ID_HEATH_PROTECT_74;
let replenishmentId77 = process.env.REPLISHMENT_ID_HEATH_PROTECT_77;
const sku_74 = [];
const sku_77 = [];
var replenishmentId = "";

exports.handler = function (request, context) {
  if (
    request.directive.header.namespace === "Alexa.Discovery" &&
    request.directive.header.name === "Discover"
  ) {
    log("DEBUG:", "Discover request", JSON.stringify(request));
    handleDiscovery(request, context);
  } else {
    log("DEBUG:", "---NON---- Discover request");
    log("DEBUG:", "NON Discover request", JSON.stringify(request));
    handleNonDiscovery(request, context);
  }
};

async function handleDiscovery(request, context) {
  var tokenValue = request.directive.payload.scope.token;
  const decodedJwt = jwt.decode(tokenValue, {
    complete: true,
  });
  var username = decodedJwt.payload.username;
  console.log(username);
  const payload1 = {
    TableName: dbtableNameReg,
    IndexName: "subject-index",
    KeyConditionExpression: "subject = :subject",
    ExpressionAttributeValues: {
      ":subject": username,
    },
  };
  var deviceUUID = await getDeviceUUID(username);
  var cmData = await getDeviceName(deviceUUID);

  let cmDataJson = JSON.parse(cmData);
  let skuNumber = "";
  let deviceName = "";
  console.log(skuNumber);
  console.log(deviceName);

  if (sku_74.includes(skuNumber)) {
    console.log("yes 74");
    replenishmentId = replenishmentId74;
  } else if (sku_77.includes(skuNumber)) {
    replenishmentId = replenishmentId77;
  } else {
    console.log("Invalid SKU for US");
  }

  console.log(deviceUUID);
  var payload = {
    endpoints: [
      {
        endpointId: deviceUUID,
        friendlyName: deviceName,
        description: "",
        manufacturerName: "B",
        displayCategories: ["AIR_PURIFIER"],
        cookie: {},
        capabilities: [
          {
            type: "AlexaInterface",
            interface: "Alexa.InventoryLevelSensor",
            instance: "filter",
            version: "3",
            properties: {
              supported: [
                {
                  name: "level",
                },
              ],
              retrievable: false,
              proactivelyReported: true,
            },
            configuration: {
              measurement: {
                "@type": "Percentage",
              },
              replenishment: {
                "@type": "DashReplenishmentId",
                value: replenishmentId,
              },
            },
            capabilityResources: {
              friendlyNames: [
                {
                  "@type": "text",
                  value: {
                    text: "filter",
                    locale: "en-US",
                  },
                },
              ],
            },
          },
          {
            type: "AlexaInterface",
            interface: "Alexa",
            version: "3",
          },
        ],
      },
    ],
  };
  var header = request.directive.header;
  header.name = "Discover.Response";
  log(
    "DEBUG:",
    "Discovery Response: ",
    JSON.stringify({
      header: header,
      payload: payload,
    })
  );
  context.succeed({
    event: {
      header: header,
      payload: payload,
    },
  });
}

async function handleNonDiscovery(request, context) {
  var payload = {};
  var header = request.directive.header;
  var token = request.directive.payload.grantee.token;
  var code = request.directive.payload.grant.code;
  const decodedJwt = jwt.decode(token, {
    complete: true,
  });
  var username = decodedJwt.payload.username;
  const params22 = {
    FunctionName: lambdaNamePreToken,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      username: username,
      code: code,
    }),
  };
  try {
    const data = await lambda.invoke(params22).promise();
    console.log("Lambda invoked!");
    console.log("Success Case");
    console.log(data.Payload);
  } catch (err) {
    console.log("Fail Case");
    console.log(err, err.stack);
    throw err;
  }
  header.name = "AcceptGrant.Response";
  log(
    "DEBUG:",
    "Discovery Response: ",
    JSON.stringify({
      header: header,
      payload: payload,
    })
  );
  context.succeed({
    event: {
      header: header,
      payload: payload,
    },
  });
}

function log(message, message1, message2) {
  console.log(message + message1 + message2);
}

async function getDeviceUUID(username) {
  return new Promise((resolve, reject) => {
    console.log("inside  get device uuid");
    const payload = {
      TableName: dbtableNameReg,
      IndexName: "subject-index",
      KeyConditionExpression: "subject = :subject",
      ExpressionAttributeValues: {
        ":subject": username,
      },
    };
    console.log(payload);
    dynamo.query(payload, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data.Items[0]["duuid"]);
      }
    });
  });
}

async function getDeviceName(duuid) {
  return new Promise((resolve, reject) => {
    const payload = {
      TableName: "",
      KeyConditionExpression: "#uuid = :uuidval and #version > :vdata",
      ExpressionAttributeNames: {
        "#uuid": "uuid",
        "#version": "version",
        "#activeflag": "activeflag",
      },
      ExpressionAttributeValues: {
        ":uuidval": duuid,
        ":vdata": 1,
        ":truedata": true,
      },
      ScanIndexForward: false,
      FilterExpression: "#activeflag= :truedata",
    };
    console.log(payload);
    dynamo.query(payload, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.stringify(data.Items[0]));
      }
    });
  });
}
