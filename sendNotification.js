var firebase = require('firebase-admin');
var request = require('request');
var colours = require('./colours').colours;
var coloursVersion = require('./colours').version;
var inquirer = require('inquirer');
var LocalStorage = require('node-localstorage').LocalStorage;
//#region Begin global callbacks
/**
 * This callback calls when the Promise results in a success.
 * @callback onSuccess
 */
//#endregion End
/**
 * Help flag (parameter)
 */
var FLAG_HELP = false;
/**
 * Flag to send a message via the Firebase Admin SDK
 */
var FLAG_SENDMSG = false;
/**
 * Flag to output the version
 */
var FLAG_VERSION = false;
/**
 * Flag to enable debugging
 */
var FLAG_DEBUG = true;
/**
 * Flag to disable warnings
 */
var FLAG_DISABLE_WARNINGS = false;
/**
 * Flag to listen for notification requests
 */
var FLAG_NOTIFICATION_REQUESTS = false;
/**
 * The API key
 */
var API_KEY = "AAAApiOyKSY:APA91bFV9osUEyJW-a9beljK3bW9aRc_MkIZoN2lX6HAh45NsrfkA1TyWxdUAPqqDz24X7ZGu1W1tq7pqMAkhgXaW4PspjbSTTG4pK5Z6Vc3tZu1fhRJe06esTyzXOHcwHUzptHjKuEx"; // Your Firebase Cloud Messaging Server API key
/**
 * The script's version
 */
var VERSION = "1.0.0";
// Fetch the service account key JSON file contents
var serviceAccount = require("./serviceAccountKey.json");
// Available topics (for use with Inquirer.js)
var availableTopicsList = [
  {
    value: 'app_updates',
    name: 'App updates'
  },
  {
    value: 'all',
    name: 'Everyone (note: do not use unless it is absolutely needed)'
  },
  {
    value: 'debug',
    name: 'Debug (note: this is only for devices that have the topic added)'
  },
  {
    value: 'critical_alerts',
    name: 'Critical alerts'
  },
  {
    value: 'promotions',
    name: 'Promotions, deals (unused)'
  }
].sort(function (a, b) { return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0); });;
// Available topics
var topics = availableTopicsList.map(obj => obj.value);
// Available notification channels (for use with Inquirer.js)
var notificationChannelsList = [
  {
    value: 'todo_updates',
    name: 'Todo updates'
  },
  {
    value: 'weekly_summary',
    name: 'Weekly summary'
  },
  {
    value: 'sync',
    name: 'Sync'
  },
  {
    value: 'app_updates',
    name: 'App updates'
  },
  {
    value: 'playback',
    name: 'Playback'
  },
  {
    value: 'uncategorised',
    name: 'Uncategorised'
  }
].sort(function (a, b) { return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0); });;
// Available topics
var notificationChannels = notificationChannelsList.map(obj => obj.value);
// Set localStorage
if (typeof localStorage === 'undefined' || localStorage === null) {
  localStorage = new LocalStorage('./scratch');
}
// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://studybuddy-e5f46.firebaseio.com/"
});
/**
 * Gets the number of spaces required. To be used for the version parameter only.
 * @param {string} inputStr The input string
 * @param {number} requiredSpaces The required spaces
 * @returns {string}
 */
var getSpaces = (inputStr, requiredSpaces) => {
  if (typeof requiredSpaces !== 'number') {
    throw new Error('requiredSpaces requires a number');
  } else {
    if (inputStr.length > requiredSpaces) {
      throw new Error('Either the requiredSpaces parameter is too small or the inputStr is too long.');
    } else {
      var neededSpaces = requiredSpaces - inputStr.length;
      return ' '.repeat(neededSpaces);
    }
  }
}
/**
 * Listens for notification requests
 */
var listenForNotificationRequests = () => {
  console.log(colours.fgyellow, "Listening for notification requests...", colours.reset);
  var requests = firebase.firestore().collection('notificationRequests');
  requests.onSnapshot((snapshot) => {
    console.log(colours.fggreen, "listenForNotificationRequests: Snapshot listener called", colours.reset);
    for (var i = 0; i < snapshot.docs.length; i++) {
      sendNotificationToUser(snapshot.docs[i].data().username, false, snapshot.docs[i].data().message, snapshot.docs[i].data().body, snapshot.docs[i].data().icon, snapshot.docs[i].data().color, snapshot.docs[i].data().data.notificationChannelId, snapshot.docs[i].data().data.notificationActions, () => {
        console.log(i);
        requests.doc(snapshot.docs[i].data().id).delete().then(result => {
          console.log('Document was deleted at ' + result.writeTime);
        });
      });
    }
  }, (error) => {
    console.error(error);
  })
};

/**
 * Sends a notification to a user/topic
 * @param {string} usernameOrTopic The username or topic to send the message to
 * @param {boolean} isTopic Whether the previous argument is a topic
 * @param {string} message The message of the message
 * @param {string} body The content of the message
 * @param {string} [icon=ic_studybuddy_notification_icon] The icon of the message
 * @param {string} [color=#9c27b0] -he colour of the notification
 * @param {string} notificationChannelId The Android Notification Channel ID to send to
 * @param {*} notificationActions The notification actions (an array)
 * @param {onSuccess} onSuccess The success function
 */
function sendNotificationToUser(usernameOrTopic, isTopic, message, body, icon, color, notificationChannelId, notificationActions, onSuccess) {
  if (!icon) {
    icon = 'ic_notification_studybuddy_24dp';
  }
  if (!color) {
    // The default primary colour for the app
    color = '#9c27b0';
  }
  if (isTopic) {
    request({
      url: 'https://fcm.googleapis.com/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=' + API_KEY
      },
      body: JSON.stringify({
        notification: {
          title: message,
          body: body,
          icon: icon,
          color: color
        },
        notificationChannelId: notificationChannelId,
        data: {
          notificationChannelId: notificationChannelId,
          notificationActions: notificationActions
        },
        to: '/topics/' + usernameOrTopic
      })
    }, function (error, response, body) {
      if (error) { console.error(error); }
      else if (response.statusCode >= 400) {
        console.error(colours.fgred, `HTTP Error:  ${response.statusCode} - ${response.statusMessage}`, colours.reset);
      }
      else {
        onSuccess();
      }
    });

  } else {
    request({
      url: 'https://fcm.googleapis.com/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': ' application/json',
        'Authorization': 'key=' + API_KEY
      },
      body: JSON.stringify({
        notification: {
          title: message,
          body: body,
          icon: icon,
          color: color
        },
        data: {
          notificationChannelId: notificationChannelId,
          notificationActions: JSON.stringify(notificationActions)
        },
        to: '/topics/user_' + usernameOrTopic
      })
    }, function (error, response, body) {
      if (error) { console.error(error); }
      else if (response.statusCode >= 400) {
        console.error(colours.fgred, `HTTP Error:  ${response.statusCode} - ${response.statusMessage}`, colours.reset);
      }
      else {
        onSuccess();
      }
    });

  }
}
// Arguments list
var args = process.argv.splice(2);

// The following parameters are only allowed once, so I'll use an if elif statement here
if (args.indexOf('--help') > -1 || args.indexOf('-h') > -1) {
  FLAG_HELP = true;
} else if (args.indexOf('--version') > -1 || args.indexOf('-v') > -1) {
  FLAG_VERSION = true;
} else if (args.indexOf('--send-message') > -1 || args.indexOf('-sm') > -1 || args.indexOf('--message') > -1 || args.indexOf('--send-fcm') > -1 || args.indexOf('--fcm') > -1) {
  FLAG_SENDMSG = true;
} else if (args.indexOf('--listen-notifications') > -1 || args.indexOf('--listen-to-notifications') > -1 || args.indexOf('-ln') > -1 || args.indexOf('--notifications') > -1) {
  FLAG_NOTIFICATION_REQUESTS = true;
}
// Disable warnings flag
if (args.indexOf('--disable-warnings') > -1 || args.indexOf('--hide-warnings') > -1 || args.indexOf('--warnings-hide') > -1) {
  FLAG_DISABLE_WARNINGS = true;
}

if (FLAG_NOTIFICATION_REQUESTS) {
  listenForNotificationRequests();
}
// Arguments are empty; show help
if (args.length == 0) {
  FLAG_HELP = true;
}
if (FLAG_HELP) {
  console.log(colours.fgcyan + colours.bright,
    `
+=============+
| Script help |
+=============+

+=============================================================================================+
|                                    Individual parameters                                    |
+=============================================================================================+
|                      Parameter                     |               Description              |
+====================================================+========================================+
| --help / -h                                        | Outputs help for the script and exits  |
| ---------------------------------------------------+--------------------------------------- |
| --version / -v                                     | Outputs the script's version and exits |
| ---------------------------------------------------+--------------------------------------- |
| --send-message / -sm / --message                   | Sends a message using FCM (Firebase    |
| / --send-fcm / --fcm                               | Cloud Messaging) to devices.           |
| ---------------------------------------------------+--------------------------------------- |
| --listen-notifications / --listen-to-notifications | Listens to notification requests       |
| / -ln / --notifications                            | (see the source code for more info)    |
+====================================================+========================================+


+=====================================================================+
|                          Other parameters                           |
+======================================+==============================+
|                Parameter             |         Description          |
+======================================+==============================+
| --disable-warnings / --hide-warnings | Disables warnings.           |
| / --warnings-hide                    |                              |
|--------------------------------------+------------------------------|
| --send-notification-again / -sna     | Send the previous message    |
| / --send-prev-notification / -spn    | (to be used with the send    |
|                                      | message param)               |
|--------------------------------------+------------------------------|
| --clear-sent-msg / -csm              | Clears the message which was |
| / --clear-sent-message               | sent (to be used with the    |
|                                      | send message param)          |
+======================================+==============================+
    `
  );
  process.exit();
}
if (FLAG_VERSION) {
  console.log(colours.fgyellow, `
+=======================+
|   ${colours.bright}About this script${colours.reset}${colours.fgyellow}   |
| --------------------- |
| Version: ${VERSION} ${getSpaces(`| Version: ${VERSION} |`, 25)}|
+=======================+
|      ${colours.bright}Dependencies${colours.reset}${colours.fgyellow}     |
| --------------------- |
| NodeJS ${process.versions.node} ${getSpaces(`| NodeJS ${process.versions.node} |`, 25)}|
| FirebaseSDK ${firebase.SDK_VERSION} ${getSpaces(`| FirebaseSDK ${firebase.SDK_VERSION} |`, 25)}|
| Colours.js: ${coloursVersion} ${getSpaces(`| Colours.js: ${coloursVersion} |`, 25)}|
+=======================+`, colours.reset);
  process.exit();
}

if (FLAG_SENDMSG) {
  /**
   * Gets the users which are signed in with Firebase Authentication
   * @returns {Promise<*>} Promise of the users
   */
  var getUsers = () => {
    return firebase.auth().listUsers(10);
  }
  /**
   * Prompts questions and returns the promise
   * @param {*} users The users returned from {@link getUsers}
   * @returns {Promise<*>} Returns a promise
   */
  var promptQns = (users) => {
    const requireNumbersOnly = value => {
      if (/^\d+$/.test(value)) {
        return true;
      } else {
        return 'Please enter only numbers!';
      }
    }
    var sendMsgQns = [
      {
        type: 'confirm',
        name: 'showMoreOpts',
        message: 'Would you like to show more options?'
      },
      {
        type: 'confirm',
        name: 'useEditor',
        message: 'Would you like to use the editor (configured in ~/.bashrc) instead of an input?'
      },
      {
        type: 'list',
        name: 'sendMsgNow',
        message: 'Would you like to send the message now or later (will be saved)?',
        choices: [
          'Send now',
          'Send later'
        ]
      },
      // {
      //  type: 'confirm',
      //  name: 'useTopic',
      //  message: 'Would you like to send the notification to a topic instead of a user?'
      // },
      {
        type: 'list',
        name: 'topicList',
        message: 'Choose a topic to send this message to:',
        choices: [],
        pageSize: 12,
        default: 'Other Username'
      },
      {
        type: 'input',
        name: 'username',
        message: 'Enter the username to send this message to (use the user\'s ID):',
        when: (answers) => {
          return answers.topicList == 'Other Username';
        }
      },
      {
        type: 'input',
        name: 'topic',
        message: 'Enter the topic to send this message to:',
        when: (answers) => {
          return answers.topicList == 'Other Topic';
        }
      },

      {
        type: 'input',
        name: 'msgTitle',
        message: 'Enter the message title:'
      },
      {
        type: 'editor',
        name: 'msgBody',
        message: 'Enter the message body:',
        when: (answers) => {
          return answers.useEditor;
        }
      },
      {
        type: 'input',
        name: 'msgBody',
        message: 'Enter the message body:',
        when: (answers) => {
          return !answers.useEditor;
        }
      },
      {
        type: 'list',
        name: 'msgIcon',
        message: 'Enter the message icon:',
        default: 'ic_notification_studybuddy_24dp',
        choices: [
          'ic_notification_alert_decagram_24dp',
          'ic_notification_calendar_24dp',
          'ic_notification_calendar_today_24dp',
          'ic_notification_help_circle_24dp',
          'ic_notification_info_24dp',
          'ic_notification_studybuddy_24dp',
          'ic_notification_system_update_24dp'
        ],
        when: (answers) => {
          return answers.showMoreOpts;
        }
      },
      {
        type: 'input',
        name: 'msgColor',
        default: '#9c27b0',
        message: 'Enter a colour (must be hex) for the notification:'
      },
      {
        type: 'list',
        name: 'notificationChannelId',
        default: 'uncategorised',
        choices: [],
        message: 'Enter the Android notification channel ID:',
        when: (answers) => {
          return answers.showMoreOpts;
        }
      },
      {
        type: 'input',
        name: 'timeToLive',
        default: '4000',
        message: 'Set the time to live:',
        validate: requireNumbersOnly
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Set the priority of the notification (Android only):',
        when: (answers) => {
          return answers.showMoreOpts;
        },
        choices: [
          'normal',
          'high'
        ]
      }
    ]
    if (typeof users !== undefined) {
      sendMsgQns[3].choices.push(new inquirer.Separator('Users'));
      for (var i = 0; i < users.length; i++) {
        sendMsgQns[3].choices.push({ name: users[i].email, value: users[i].uid });
      }
      sendMsgQns[3].choices.push(new inquirer.Separator('Topics'));
      for (var i = 0; i < availableTopicsList.length; i++) {
        sendMsgQns[3].choices.push(availableTopicsList[i]);
      }
      sendMsgQns[3].choices.push(new inquirer.Separator('Other'));
      sendMsgQns[3].choices.push({ name: 'Other Username' });
      sendMsgQns[3].choices.push({ name: 'Other Topic' });
    } else {
      throw new Error('This method requires the users parameter.');
    }
    for (var i = 0; i < notificationChannelsList.length; i++) {
      sendMsgQns[11].choices.push(notificationChannelsList[i]);
    }
    return inquirer.prompt(sendMsgQns);
  }
  /**
   * Sends a notification
   * @param {*} answers The answers from the prompting of questions
   */
  function sendNotification(answers) {
    var notificationUsernameOrTopic = '', isTopic = false;
    if (answers.username != null && answers.topicList == 'Other Username') {
      notificationUsernameOrTopic = answers.username;
    } else if (answers.topic != null && answers.topicList == 'Other Topic') {
      notificationUsernameOrTopic = answers.topic;
      isTopic = true;
    } else {
      notificationUsernameOrTopic = answers.topicList;
      getUsers().then(result => {
        for (var i = 0; i < result.users.length; i++) {
          if (notificationUsernameOrTopic == result.users[i].uid) {
            isTopic = false;
          } else {
            isTopic = true;
          }
        }
      })
    };
    sendNotificationToUser(notificationUsernameOrTopic, isTopic, answers.msgTitle, answers.msgBody, answers.msgIcon, answers.msgColor, answers.notificationChannelId, [
      {
        action: 'Configure notification',
        actionType: 'com.edricchan.studybuddy.intent.ACTION_NOTIFICATIONS_SETTINGS_INTENT',
        actionIcon: 'settings'
      }
    ], () => {
      console.log(colours.fggreen, 'Successfully sent! You should see it appear on the device!', colours.reset);
      localStorage.setItem('sentMessage', JSON.stringify(answers));
    })
  }
  if (!FLAG_DISABLE_WARNINGS) {
    console.warn(colours.fgyellow + colours.bright, 'Wondering where the notification actions option went? It\'s been temporarily removed due to some issues with FCM. Don\'t worry though. I\'ll fix it soon.', colours.reset);
  }
  if (args.indexOf('--clear-sent-msg') > -1 || args.indexOf('-csm') > -1 || args.indexOf('--clear-sent-message') > -1) {
    inquirer.prompt({ type: 'confirm', message: 'Are you sure you want to delete the sent message?', name: 'deleteSentMsg' }).then(answers => {
      if (answers.deleteSentMsg) {
        localStorage.removeItem('sentMessage');
      }
    })
  } else if ((args.indexOf('--send-notification-again') > -1 || args.indexOf('-sna') > -1 || args.indexOf(('--send-prev-notification') > -1 || args.indexOf('-spn')) > -1) && localStorage.getItem('sentMessage') != null) {
    inquirer.prompt({ type: 'confirm', message: 'Send previously sent message?', name: 'sendPrevSentMsg' }).then(answers => {
      if (answers.sendPrevSentMsg) {
        sendNotification(JSON.parse(localStorage.getItem('sentMessage')));
      }
    })
  } else if (localStorage.getItem('previousMessage') != null) {
    inquirer.prompt({
      type: 'list',
      message: 'Previous message save detected. Send previous message?',
      name: 'sendPrevMsg',
      choices: [
        'Send previous message now',
        'Delete previous message and skip',
        'Delete previous message and quit',
        'Quit'
      ]
    }).then(answers => {
      switch (answers.sendPrevMsg) {
        case 'Send previous message now':
          localStorage.setItem('sentMessage', localStorage.getItem('previousMessage'));
          sendNotification(JSON.parse(localStorage.getItem('previousMessage')));
          localStorage.removeItem('previousMessage');
          break;
        case 'Delete previous message and skip':
          inquirer.prompt({ type: 'confirm', message: 'Are you sure you want to delete the previous message and skip?', name: 'confirmDelete' }).then(answers => {
            if (answers.confirmDelete) {
              localStorage.removeItem('previousMessage');
              console.log(colours.fggreen, 'Successfully removed previous message', colours.reset);
              getUsers().then(result => {
                var users = null;
                for (var i = 0; i < result.users.length; i++) {
                  users = result.users;
                }
                promptQns(users)
                  .then(answers => {
                    // console.log(colours.fgyellow, JSON.stringify(answers, null, '  '));
                    localStorage.setItem('previousMessage', JSON.stringify(answers));
                    console.log(colours.fggreen, 'Message was saved!', colours.reset);

                    // Check if user wants to send message now
                    if (answers.sendMsgNow == 'Send now') {
                      sendNotification(answers);
                    }
                  })
              });
            }
          })
          break;
        case 'Delete previous message and quit':
          inquirer.prompt({ type: 'confirm', message: 'Are you sure you want to delete the previous message and quit?', name: 'confirmDelete' }).then(answers => {
            if (answers.confirmDelete) {
              localStorage.removeItem('previousMessage');
              console.log(colours.fggreen, 'Successfully removed previous message', colours.reset);
              process.exit(0);
            }
          })
          break;

        case 'Quit':
          console.log(colours.fgred, 'Exiting..', colours.reset);
          process.exit(0);
          break;
      }


    })
  } else {
    getUsers().then(result => {
      var users = null;
      users = result.users;
      promptQns(users)
        .then(answers => {
          // console.log(colours.fgyellow, JSON.stringify(answers, null, '  '));
          localStorage.setItem('previousMessage', JSON.stringify(answers));
          console.log(colours.fggreen, 'Message was saved!', colours.reset);

          // Check if user wants to send message now
          if (answers.sendMsgNow == 'Send now') {
            sendNotification(answers);
          }
        })
    })
  }
  // TODO: Initially check if there's a previous message saved

  // Function to check if string only has digits

}
