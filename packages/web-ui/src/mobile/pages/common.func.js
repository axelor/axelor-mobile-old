import ons from "onsenui";
import Translate, { translate } from "../locale";

export const getSepratedPrice = (value, operator = ",") => {
  if ([null, undefined].includes(value)) {
    return "";
  }
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, operator);
};

export const runAction = async (actionCall, context, actionName) => {
  // run actionCall
  const data = { context, action: actionName };
  let actionResponse = await actionCall("", data);
  while (Array.isArray(actionResponse.data) && actionResponse.data[0].pending) {
    const responseData = actionResponse.data[0];
    if(responseData.alert) {
      const index = await ons.notification
        .confirm(responseData.alert, {
          title: "Warning",
          buttonLabels: [
            translate("Alert.cancelButton"),
            translate("Alert.yesButton"),
          ],
        })
        if (index === 1) {
          actionResponse = await runAction(
            actionCall,
            context,
            actionResponse.data[0].pending
          );
        } else {
          return actionResponse;
        }
    } else {
      actionResponse = await runAction(
        actionCall,
        context,
        actionResponse.data[0].pending
      );
    }

  }
  return actionResponse;
};
