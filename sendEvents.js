var AWS = require("aws-sdk");
var request = require("request");
let regionValue = process.env.REGION;
let iot_endpoint = process.env.IOT_ENDPOINT;
AWS.config.update({
  region: regionValue,
});
var iotData = new AWS.IotData({
  endpoint: iot_endpoint,
});

let dbtableNameSmart = process.env.TABLE_NAME_SMART_HOME;
let api_URL = process.env.API_URL;
let auth_api_URL = process.env.AUTH_API_URL;
let client_id = process.env.CLIENT_ID;
let client_secret = process.env.CLIENT_SECRET;

var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context, callback) => {
  let params = {
    TableName: dbtableNameSmart,
  };
  let dbData = await dbRead(params);
  for (const data of dbData) {
    let accessToken = data["payload"]["access_token"];
    let refreshToken = data["payload"]["refresh_token"];
    let thingName = data.uuid;
    let username = data.username;
    let thingData = await getThingData(thingName);
    let payload = JSON.parse(thingData.payload);
    let filterusage = Number(payload.state.reported.filterusage);
    let endpointId = thingName;

    if (filterusage == 1000) {
      filterusage = 11;
    } else {
      filterusage = 100 - filterusage;
    }

    let apiResponse = await sendEvents(
      endpointId,
      filterusage,
      accessToken,
      refreshToken
    );

    if (apiResponse !== null && apiResponse !== "") {
      let bba = JSON.parse(apiResponse);

      let accessToken = bba.access_token;

      let apiResponse1 = await sendEvents(
        endpointId,
        filterusage,
        accessToken,
        refreshToken
      );
      await saveData(endpointId, apiResponse, username);
    } else {
      console.log("Event Sent.....!!!");
    }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify("Sucess!"),
  };
  return response;
};
async function dbRead(params) {
  let promise = docClient.scan(params).promise();
  let result = await promise;
  let data = result.Items;
  if (result.LastEvaluatedKey) {
    params.ExclusiveStartKey = result.LastEvaluatedKey;
    data = data.concat(await dbRead(params));
  }
  return data;
}

async function getThingData(thingName) {
  var paramsGet = {
    thingName: thingName,
  };
  let promise = iotData.getThingShadow(paramsGet).promise();
  let result = await promise;
  return result;
}

async function sendEvents(endpointId, filterusage, token, refreshToken) {
  return new Promise((resolve, reject) => {
    var options = {
      method: "POST",
      url: api_URL + "?access_token=" + token,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        event: {
          header: {
            namespace: "Alexa",
            name: "ChangeReport",
            messageId: "30f3052d-d36f-4f09-90f4-610d21c34044",
            payloadVersion: "3",
          },
          endpoint: {
            scope: {
              type: "BearerToken",
              token: token,
            },
            endpointId: endpointId,
          },
          payload: {
            change: {
              cause: {
                type: "PERIODIC_POLL",
              },
              properties: [
                {
                  namespace: "Alexa.InventoryLevelSensor",
                  instance: "filter",
                  name: "level",
                  value: {
                    "@type": "Percentage",
                    value: filterusage,
                  },
                  timeOfSample: "2019-10-31T17:00:00Z",
                  uncertaintyInMilliseconds: 0,
                },
              ],
            },
          },
        },
        context: {},
      }),
    };
    request(options, function (error, response) {
      if (error) {
        reject(error);
      } else if (response.statusCode === 401) {
        var options = {
          method: "POST",
          url: auth_api_URL,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie:
              "",
          },
          form: {
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: client_id,
            client_secret: client_secret,
          },
        };
        request(options, function (error, response) {
          if (error) {
            throw new Error(error);
          } else {
            resolve(response.body);
          }
        });
      } else {
        console.log("EVENT SENT SUCCESSFULLY");
        resolve(response.body);
      }
    });
  });
}

async function saveData(deviceID, payload, username) {
  var table = dbtableNameSmart;
  var params = {
    TableName: table,
    Item: {
      uuid: deviceID,
      username: username,
      payload: JSON.parse(payload),
    },
  };
  docClient.put(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to add item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("Added item:", JSON.stringify(data, null, 2));
    }
  });
}
