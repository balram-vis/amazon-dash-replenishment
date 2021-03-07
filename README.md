# Welcome to AWS Dash Replenishment

#Dash Replenishment Management and Reorders

## Dash Replenishment through the Alexa Skill

## Overview

Dash Replenishment uses the Alexa Smart Home cloud to listen for inventory updates and notifies the user through different channels (e.g. email, Alexa notifications).

Connecting with DRS through the Alexa Smart Home cloud requires the following technologies:

-   A  **Smart Home skill**  in the Alexa console - this skill may include one or more models (e.g. Custom, Video, Smart Home) but DRS will use the Smart Home model for the purpose of discovering the connected device and receiving inventory signals.
-   A  **Lambda function**  on AWS - will process inventory updates sent by the manufacturer cloud (your cloud) and will forward them to the Alexa Smart Home cloud. It will also be in charge of sending a  `Discover.Response`  to inform the Alexa cloud of a new device ID being available.
-   An  **Oauth2 server**  in your cloud - will be responsible for the account linking process when a customer enables the Smart Home skill in their Alexa account. This server provides an authorization grant to the Alexa Smart Home cloud and allows Alexa to read information about the connected device.

## Create a new device[](https://developer.amazon.com/docs/dash/dash-replenishment-create-device.html#create-a-new-device)

There are three steps required in this process. You will first create a new device, then customize it and finally you will take the  `replenishmentId`  for each slot to use in your lambda function.

Start by heading to the  [DRS Self-Service Portal](https://developer.amazon.com/dash-replenishment/index.html)  (_Opens in a new Tab_) and click on  **Begin**  if you don't have a device in the console yet.

### Step 1. Set up the DRS-enabled device[](https://developer.amazon.com/docs/dash/dash-replenishment-create-device.html#step-1-set-up-the-drs-enabled-device)

1.  Click on  **Create a device**
2. Choose a device name and a model ID. The **device name** will be used to identify your new device in the DRS Self-Service Portal. You will later be able to define a customer-facing name in the localization screen.
3. You are now able to customize customer-facing information.

### Step 2. Customize your device
Click on **My Devices**, then click on the device you have just created. You will be taken to the device customization page.

> Customize a generic device
> For any device that you create, you can customize the following properties:
>
> **Device Slots**: A slot is a consumable that your device can replenish. For a printer, each slot will represent the toner or ink color, so "Slot 01" slot name could be "Black ink", "Slot 02" could be "Magenta ink" and so on. For a washing machine "Slot 01" could represent the detergent and another slot could represent the softener. Your device must be able to check the levels of each slot and re-order the associated consumables individually, when required.
> - **Marketplace**: where your device will be sold. Each marketplace will need to be localized and certified.
>-   **Device Localization**: This device name will appear in the customer's Amazon account.
>-   **ASIN list**: the list of products each slot will contain. Your Amazon point of contact will provide this.
>-   **Device image**: this image will appear in the customer's Amazon account.

## Step 3. Retrieve the replenishmentId
> **Note:** Please contact your Amazon DRS representative to retrieve the replenishmentId.

## Step 4. Configure a smart home Alexa Skill
The steps required in this process depend on whether your connected products already use any of the Alexa capabilities.

![alt text](https://m.media-amazon.com/images/G/01/mobile-apps/dex/dash/test/Alexa-choose-smart-home._TTH_.png)

## Step 5. Account linking
In your skill, account linking lets you connect the identity of the user with a user account in a different system. More information about account linking is available in the  [Alexa developer docs](https://developer.amazon.com/docs/account-linking/understand-account-linking.html)  (_Opens in a new tab_).

To perform account linking in a Smart Home skill, your cloud needs to provide an Oauth2 compliant server and must use authorization code grant to authorize the user and obtain an access token.

From your skill in the Alexa console, click on "Account linking" on the left and fill out your server details.

![alt text](https://m.media-amazon.com/images/G/01/mobile-apps/dex/dash/test/Alexa-account-linking._TTH_.png)

## Dash Replenishment Service

## Overview

Using the AWS Lambda function you can send two types of information required by the Alexa cloud for devices that have inventory sensors:

1.  A  **Discovery response**  (proactive or reactive) that adds the DRS capability for a specific device
2.  Any subsequent  **inventory update**

If your connected devices already use Smart Home APIs within a Lambda function, you may choose to use the same function and expand the existing  `Discover.Response`.

If you haven't read the  **Understanding Device Sensors (Alexa.InventorySensors)**  section  [click here](https://developer.amazon.com/docs/dash/dash-replenishment-overview.html)  before you start.

## Creating the Lambda function[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#creating-the-lambda-function)

**Note:**  Only perform these steps if you don't have a Lambda function using Alexa Smart Home APIs yet

> 1.  Sign in to the AWS Management Console and open the  [AWS Lambda console](https://console.aws.amazon.com/lambda/)  (_Opens in a new tab_). Make sure you've selected:
    -   **N.Virginia**  for English (US)
    -   **EU (Ireland)**  region for English (UK), French (FR), German, Italian, Spanish (ES)
    -   **US West (Oregon)**  for Japanese skills.
    -   More info available  [here](https://developer.amazon.com/docs/smarthome/develop-smart-home-skills-in-multiple-languages.html#deploy)
> 2.  Choose  **Create function**.
> 3.  On the Create function page, choose  **Author from scratch**
>4.  Select the Function name and the runtime (in this guide we will use Node.JS). Click on  **Create function**
>5.  Select  **Add Trigger**  and search for  **Alexa Smart Home**
> 6.  Go to your  [Alexa console](https://developer.amazon.com/alexa/console/ask/)  (_Opens in a new tab_), select the Smart Home skill you created at the beginning of this process, click on the  **Smart Home**  model and copy your skill Id

![alt text](https://m.media-amazon.com/images/G/01/mobile-apps/dex/dash/test/Alexa-copy-skill-id._TTH_.png)

>7.  Go back to the  **Trigger**  page of your Lambda function and paste the skill Id in the  **Application ID**  field. Click  **Add**

**Note**:  You may now copy the  `ARN`  visible on the top right part of the AWS console.

1.  Go back to the Alexa console, in the Smart Home section of your skill and paste the ARN in the  **Default endpoint**  field.

If you have regional endpoints for your Smart Home skill you can choose to change the endpoint to target customers who are closest to it.

## 1. Discovering the device[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#1-discovering-the-device)

The Lambda function will be using the Smart Home Skill API to provide  _capability interfaces_  that enable you to describe your devices and the  _properties_,  _events_, and  _directives_  that they support. You describe a device to Alexa by sending a  [Discover.Response](https://developer.amazon.com/docs/device-apis/alexa-discovery.html#response)  event after receiving a  [Discover](https://developer.amazon.com/docs/device-apis/alexa-discovery.html#discover)  directive from Alexa, or by proactively sending an  [AddOrUpdateReport](https://developer.amazon.com/docs/device-apis/alexa-discovery.html#addorupdatereport)  to Alexa for any device already discovered.

### Discovering the device upon account linking[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#discovering-the-device-upon-account-linking)

The initial configuration established through a  `Discover.Response`  can be triggered by the  `Discover`  directives upon account linking (i.e. when a customer enables the manufacturer's Smart Home skill). In simple terms, this means that when the customer enables your Smart Home skill, Alexa will send a  `Discover`  directive to your Lambda function which will trigger a  `Discover.Response`  back.

The following diagram illustrates the exchange between the Alexa cloud and the manufacturer cloud (your cloud) when a customer enables your Smart Home skill.

![](https://m.media-amazon.com/images/G/01/mobile-apps/dex/dash/test/Alexa-DRS-Set-up-tech._TTH_.png)



### Building the main logic
We will start by building the basic structure to handle our reactive `Discover.Response`.
1.  In the  **Lambda**  function code section make sure  _Edit code inline_  is selected. Leave the Runtime and Handler set to their defaults.
2.  Paste in the following code, completely replacing the code in index.js.

```
exports.handler = function (request, context) {
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEBUG:", "Discover request",  JSON.stringify(request));
        handleDiscovery(request, context);
    }

    function handleDiscovery(request, context) {
        var payload = {
          "endpoints": [{
              "endpointId": "appliance-001", // This can be a device serial number to help you identify it uniquely
              "friendlyName": "Printer",
              "description": "Printer by Sample Manufacturer",
              "manufacturerName": "Sample Manufacturer",
              "displayCategories": [
                "OTHER"
              ],
              "cookie": {},
              "capabilities": [
                // Capabilities array
              ]
            }]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG:", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }
};

```
1.  Click  **Save**
The above sample code will do two things:

1.  Listen for a  `Discover`  directive
2.  Respond with an  `Alexa.Discovery`  response

The content of the Reactive Discovery response will include a predefined header that will help the Alexa cloud identify the intent of the request:

```
{
  "event": {
    "header": {
      "namespace": "Alexa.Discovery",
      "name": "Discover.Response",
      "payloadVersion": "3",
      "messageId": "00000000-0000-0000-0000-000000000000"
    },
    "payload": {
      //Device-specific payload
    }
  }
}

```

The payload object will include an array of endpoints you wish Alexa to discover, each including device-specific attributes to help the Alexa cloud display the appropriate device information within the Alexa app. A single Discovery Response may contain multiple endpoints (e.g. a customer with two printers) that can be bundled in one single request:

```
  "endpoints": [{
      "endpointId": "appliance-001", // This can be a device serial number to help you identify it uniquely
      "friendlyName": "Printer",
      "description": "Printer by Sample Manufacturer",
      "manufacturerName": "Sample Manufacturer",
      "displayCategories": [
        "OTHER"
      ],
      "cookie": {},
      "capabilities": [
        // Capabilities array
      ]
    }]

```

And finally, the capabilities array will include one or more capability objects that describe each of the consumable sensors available for replenishment:

```
{
          "type": "AlexaInterface",
          "interface": "Alexa.InventoryLevelSensor", // The default type of sensors
          "version": "3",
          "instance": "InventoryLevelSensor-1", // A unique name to reference your sensor. It has to be the same for this sensor across all customers.

          "properties": {
            "supported": [{
              "name": "level" // Property that defines the type of sensor
            }],
            "proactivelyReported": true,
            "retrievable": true
          },

          "capabilityResources": {
            "friendlyNames": [{
              "@type": "text",
              "value": {
                "text": "Magenta Ink", // Localized slot name that will be displayed inside the Alexa app
                "locale": "en-US"
              }
            },
            {
              "@type": "text",
              "value": {
                "text": "Encre Magenta", // Localized slot name that will be displayed inside the Alexa app
                "locale": "fr-FR"
              }
            }]
          },

          // Capability configuration.
          "configuration": {
            "replenishment": {
              "@type": "DashReplenishmentId",
              "value": "{DRS_ARN}" // This is the replenishmentId you obtained for each slot when you created the device
            },

            "measurement": {
              "@type": "Volume", // The type of measurement the Alexa cloud should expect every time you update the inventory
              "unit": "LITER" // The type of unit the Alexa cloud should expect every time you update the inventory
            }
          }
        },

```
### Discovering a new device for an active customer[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#discovering-a-new-device-for-an-active-customer)

There may be scenarios where your cloud needs to proactively inform the Alexa cloud of a new device such as:

-   You want to add the DRS capability to a device already connected to Alexa
-   You want to add a new device for an existing account, where the customer has already performed account linking with an auth grant

There are two main differences in the JSON being sent in a proactive  `Discovery`:

1.  Your header will use  `AddOrUpdateReport`  name instead of  `Discover.Response`
2.  Your payload will contain the scope and access token of the customer you are referring to:

**Example**:

```
"endpoint": {
    "scope": {
      "type": "BearerToken",
      "token": "access-token-from-Amazon"
    },
    "endpointId": "appliance-001" //Where endpointId is the device serialnumber you are referring to
  },
  "payload": {
    //ChangeReport payload
  }

```

## 2. Sending an inventory update[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#2-sending-an-inventory-update)

When a smart device consumes inventory, you must inform the Alexa cloud of the change so that DRS can update and accurately track the overall inventory for the customer. There are currently two ways to perform this action, depending on the type of sensor you wish to update:

1.  **Level sensor**  can send the level through a  `ChangeReport`  (proactively)
2.  **Usage**  and  **LevelUsage**  sensors can use the InventoryConsumed event .

### Level Sensor[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#level-sensor)

If you want to proactively update the Alexa cloud of a state change in the consumption of your level sensor, you can use a ChangeReport.

**Note:**  A ChangeReport must be sent at least once a day.

The JSON for this request must include the following header:

```
{
"context": {},
"event": {
  "header": {
    "namespace": "Alexa",
    "name": "ChangeReport",
    "payloadVersion": "3",
    "messageId": "00000000-0000-0000-0000-000000000000"
  },
  // Endpoint details
 }
}

```

The endpoint details will include the access token your cloud already exchanged for that customer:

```
"endpoint": {
    "scope": {
      "type": "BearerToken",
      "token": "access-token-from-Amazon"
    },
    "endpointId": "appliance-001" // This can be a device serial number to help you identify it uniquely
  },
  "payload": {
    //ChangeReport payload
  }

```

And finally the payload includes any of the deltas you want to report. In this example, we are updating a level sensor with a new absolute volume:

```
"change": {
    "cause": {
      "type": "PERIODIC_POLL"
    },

    // A ChangeReport contains any pro-actively reported changes to capability properties. You state what type of capability and what instance of that capability has changed with the property that has changed. Below shows sample payloads for various measurement types.
    "properties": [
      {
        "namespace": "Alexa.InventoryLevelSensor",
        "instance": "InventoryLevelSensor-1",
        "name": "level",
        "value": {
          "@type": "Volume",
          "value": 2.5,
          "unit": "LITER"
        },
        "timeOfSample": "2018-02-03T16:20:50.52Z",
        "uncertaintyInMilliseconds": 0
      },
      {
        //Other property that has changed if more than one
      }
    ]
  }

```

You can view what an entire ChangeReport looks like here:

ChangeReport example

### Usage sensor[](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#usage-sensor)

An  `InventoryConsumed`  event can be used for  `InventoryUsageSensor`  and must always contain the following information:

-   The device details including namespace, name and endpointId
-   The customer access token
-   The payload with the inventory update

A typical InventoryConsumed event will look like the following:

```
{  
  "event": {
    "header": {
      "namespace": "Alexa.InventoryUsageSensor",
      "name": "InventoryConsumed",
      "instance": "Sensor.CoffeePod",
      "messageId": "<message id>",
      "payloadVersion": "3"
    },
    "endpoint": {
      "scope": {
        "type": "BearerToken",
        "token": "<an OAuth2 bearer token>"
      },
      "endpointId": "<endpoint id>"
    },
    "payload": {
      "usage": {
        "@type": "Count",
        "value": 1
      },
      "timeOfSample": "2020-09-23T16:20:50Z"
    }
  }
}

```

## Testing device discovery
## Step 1. Testing device discovery[](https://developer.amazon.com/docs/dash/dash-replenishment-test-skill.html#step-1-testing-device-discovery)

### Testing your Lambda function[](https://developer.amazon.com/docs/dash/dash-replenishment-test-skill.html#testing-your-lambda-function)

You may now perform a quick test of the  `Discovery`  request in the Lambda code editor.

1.  Click on  **Test**. The Configure test event page appears.
2.  Leave  **Create new test event**  selected. For  **Event template**, leave the default  **Hello World**. In the  **Event name**, enter  `discovery`  and replace the entire contents in the editor with the following code.

```
{
    "directive": {
        "header": {
            "namespace": "Alexa.Discovery",
            "name": "Discover",
            "payloadVersion": "3",
            "messageId": "1bd5d003-31b9-476f-ad03-71d471922820"
        },
        "payload": {
            "scope": {
                "type": "BearerToken",
                "token": "access-token-from-skill"
            }
        }
    }
}

```

1.  Click  **Create**, and then  **Test**. If successful, the  **Execution Result**  should be similar to the following:

```
{
  "event": {
    "header": {
      "correlationToken": "12345692749237492",
      "messageId": "1bd5d003-31b9-476f-ad03-71d471922820",
      "name": "Discover.Response",
      "namespace": "Alexa.Discovery",
      "payloadVersion": "3"
    },
    "payload": {
      "endpoints": [{
          "endpointId": "appliance-001",
          "friendlyName": "Printer",
          "description": "Printer by Sample Manufacturer",
          "manufacturerName": "Sample Manufacturer",
          "displayCategories": [
            "OTHER"
          ],
          "cookie": {},
          "capabilities": [
            {
              "type": "AlexaInterface",
              "interface": "Alexa.InventoryLevelSensor",
              "version": "3",
              "instance": "InventoryLevelSensor-1",
              "properties": {
                "supported": [{
                  "name": "level"
                }],
                "proactivelyReported": true,
                "retrievable": true
              },
                // Other Capabilities here
            }
          ]
        }]
    }
  }
}

```

### Testing on a physical device[](https://developer.amazon.com/docs/dash/dash-replenishment-test-skill.html#testing-on-a-physical-device)

When your implementation is completed, and you have tested your Lambda function, you can functionally test your smart home skill to ensure device discovery is working as expected.

1.  Make sure you have a smart home trigger added and enabled. To check this, go to the Lambda console, select your smart home skill, and make sure you have an  **Alexa Smart Home**  trigger. If you don't, go back to the Step 5 of  [Creating the Lambda Function](https://developer.amazon.com/docs/dash/dash-replenishment-lambda-function.html#creating-the-lambda-function)
2.  Sign in to the Alexa app (available on Android, iOS or the  [web](https://alexa.amazon.com/)  (_Opens in a new tab_) with the same credentials as your developer account.
3.  Find your skill in the Alexa app. To do this, go to  **Skills**, and tap  **Your Skills**  in the upper right corner of the  **All Skills**  page. Scroll to  _DEV SKILLS_  and find your skill.
4.  Click the  **ENABLE**  button to enable the skill, and you will be directed to account-link the skill to a device cloud account. If you are unable to complete account linking, make sure you are using valid credentials for the device cloud. Otherwise, it is likely there is an issue with account-linking information you provided in the developer console. For help with this, see  [Alexa: Debugging account linking](https://forums.developer.amazon.com/articles/38610/alexa-debugging-account-linking.html)  in the developer forums. If you want to remove account linking later, you should disable your skill in the Skills tab.
5.  Close the window and tap the  **DISCOVER DEVICES**  button in the Alexa app.
6.  If the skill does not discover devices, check the logs for your Lambda function to see if it received a discover directive from Alexa, and use the logs to troubleshoot the issue. Common issues include incorrectly formatted event responses.
7.  If your skill successfully discovers devices, return to the  **Test**  page of the developer console. You may test other functionalities of the skill (if any).

## Step 2. Testing the end-to-end functionality[](https://developer.amazon.com/docs/dash/dash-replenishment-test-skill.html#step-2-testing-the-end-to-end-functionality)

### Run the certification test cases[](https://developer.amazon.com/docs/dash/dash-replenishment-test-skill.html#run-the-certification-test-cases)

**Important:**  Do not deregister until certification is approved from your Amazon program manager via email.

1.  Set up a physical device through Alexa by opening the Alexa app and completing the DRS set-up upon device discovery. When selecting the notification and reorder options, choose the  **Automatic reorder when supply is low**  option.
    
2.  Check that the inventory you are sending is being captured correctly (ensure the levels match any third-party app levels being reported).
    
    To see the latest consumable level (for example, battery level), go to  **Device Settings > Supply**.
    
    Low supply notification  
      
    You will receive a notification email when the consumable level drops to your low level threshold. In some cases, we wait for three low-level PSU updates before sending a notification to be sure that it was not a random fluctuation causing the battery to report low threshold.
    
3.  Trigger a low inventory level replenishment for each slot (`replenishmentId`).
    
    Use the product so that the consumable level drops below the low-level threshold. (Note: For a replenishment order to be triggered, your consumable level must drop and remain at or below your low level threshold for 3 consecutive inventory level updates.)
    
4.  Reset the inventory level for each slot (`replenishmentId`).
    
    Replace the consumable (for example, replace the battery or ink cartridge) of the product and leave the device running until at least one  `ChangeReport`  with a new inventory value is sent to Alexa.
    
5.  Check the selection for your device. Go to  **Device Settings > Supply**  and click on the ASIN. This shows you all the ASINs that customers can select for your device.
    
6.  Trigger a low-inventory-level notification for each slot (`replenishmentId`):
    
    1.  Go to  **Device Settings**, then tap on  **Change**  in the  **Status (Supply)**  section.
    2.  Tap on the setting in  **Supply Settings**  section to open the "Notification and reorder settings" page.
    3.  Select  **Notify me when supply is low**  and then  **Continue**.
    4.  Use the product so that the consumable level drops below the low-level threshold.


