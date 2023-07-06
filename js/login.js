const { Util, RoomInit, FileUtil } = e7lib;
const isDev = location.host == "dev.vchatcloud.com" || location.host.includes("127.0.0.1");
const BASE_URL = Util.Config.host;

let fabricWrapper, fileHelper, webrtc;

let channel, userNick, userKey, channelKey;
let pw, email;
const lock = { pw: false, email: false };
let vChatCloud, CONSTRAINTS;

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

channelKey = params.channelkey || params.channelKey;
try {
  email = Util.dataEmailPaser(getParameters('data'));
} catch(e) {
  email = ""
}

const getParameters = (paramName) => {
  // 리턴값을 위한 변수 선언
  let returnValue;
  // 현재 URL 가져오기
  let url = location.search;
  // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
  let parameters = url.slice(1).split("&");
  console.log("parameters", parameters);
  // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
  for (let i = 0; i < parameters.length; i++) {
    let varName = parameters[i].split("=")[0];
    if (varName.toUpperCase() == paramName.toUpperCase()) {
      returnValue = parameters[i].split("=")[1];
      return decodeURIComponent(returnValue);
    }
  }
}

$(function () {
  // 리소스 로드 res 변수명으로 동작
  if (webrtc === undefined) {
    webrtc = new webRTC(".toast_pop", 400, 3000, 800);
    webrtc.console.action("login.js >> ", "init");
  }

  // 로그인 활성화
  webrtc.login.show();
  var enter = false;
  new RoomInit(channelKey, function (roomData) {
    if (roomData.lock() === "Y") {
      switch (roomData.lockType()) {
        case "PW":
          lock.pw = true;
          break;
        case "EM":
          lock.email = true;
          break;
        case "ALL":
          lock.pw = true;
          lock.email = true;
          break;
      }
    }
    enter = true;
    CONSTRAINTS = {
      video: {
        width: { ideal: roomData.resolution() ? roomData.resolution() *4 /3 : 320 },
        height: { ideal: roomData.resolution() ? roomData.resolution() : 240 },
      },
      audio: { echoCancellation: true, noiseSuppression: true },
    };
    vChatCloud = new VChatCloud({ url: Util.Config.chatUrl }, CONSTRAINTS);  
  });
  
  $("input", webrtc.login)
    .focus()
    .keyup(function (e) {
      if (e.keyCode == 13 && enter) {
        enter = false;
        $("button.rtc3_login_btn", webrtc.login).trigger("click");
      }
    });
  $("button.rtc3_login_btn", webrtc.login).click(async function () {
    webrtc.console.action("login.js >> ", "login start");
    let r = { nick: $("input#name", webrtc.login).val() };
    if (r.nick) {
      try {
        let joined = false;
        const entryDiv = $("#entry");
        while (!joined) {
          await new Promise((resolve, reject) => {
            if (lock.pw || lock.email) {
              entryDiv.css("display", "flex");
              $(".entry_form").hide();
              if (lock.pw) {
                $(".entry_form.pw").show();
              }
              if (lock.email && !email) {
                $(".entry_form.id").show();
              } else {
                resolve(true);
              }

              $(".entry_btnwrap .submit", entryDiv).on("click", () => {
                pw = $(".entry_form.pw input").val();
                if (!email) {
                  email = $(".entry_form.id input").val();
                }
                resolve(true);
              });
              $(".entry_btnwrap .cancel", entryDiv).on("click", () => {
                entryDiv.css("display", "none");
                $(".entry_form.pw input").val("");
                $(".entry_form.id input").val("");
                reject(false);
              });
              $(".entry_form input").on("keypress", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  $(".entry_btnwrap .submit", entryDiv).trigger("click");
                }
              });
            } else {
              resolve(true);
            }
          }).then(
            () =>
              new Promise((resolve) => {
                const clientKey = "xxxxxxxxxxxx".replace(/[xy]/g, function (a, b) {
                  return (b = Math.random() * 16), (a == "y" ? (b & 3) | 8 : b | 0).toString(16);
                });
                joinRoom(
                  {
                    roomId: channelKey,
                    clientKey: email ?? clientKey,
                    nickName: r.nick,
                    ...(lock.pw && pw ? { password: pw } : {}),
                  },
                  function (err, history) {
                    if (err) {
                      if ((err.code === 10114) | (err.code === 10115)) {
                        pw = "";
                        if (err.code === 10114) {
                          email = "";
                          $(".entry_form.id").show();
                        }
                        $(".entry_contents_subtitle").show();
                        webrtc.login.hide();
                        webrtc.rtcLogout();
                      } else {
                        console.error(err);
                        webrtc.login.hide();
                        webrtc.alert_popup({ title: "오류", msg: errMsg[err.code].kor }, function () {
                          webrtc.rtcLogout();
                        });
                      }
                    } else {
                      joined = true;
                      webrtc.login.hide();
                      // 기존 대화내용 삭제
                      $(".chat_field > p").remove();
                      // 기존 이벤트 제거
                      $(window).off("keydown").off("mousemove");
                      webrtc.customInit(history);
                      $(".entry_contents_subtitle").hide();
                      entryDiv.css("display", "none");
                      if (fabricWrapper) fabricWrapper.reJoin();
                      else fabricWrapper = new FabricWrapper();
                      if (fileHelper) fileHelper.reJoin();
                      else fileHelper = new FileHelper();
                    }
                    resolve();
                  }
                );
              })
          );
        }
      } catch (e) {
        console.error("조인 룸 오류", e);
      }
    }
    enter = true;
  });
});

// room 에 조인
function joinRoom({ roomId, clientKey, nickName, password }, callback) {
  // vchatcloud 객체
  channel = vChatCloud.joinChannel(
    {
      roomId: roomId,
      clientKey: clientKey,
      nickName: nickName,
      ...(lock.pw && pw ? { password } : {}),
    },
    function (error, history) {
      if (error) {
        if (callback) return callback(error, null);
        return error;
      }
      callback(error, history);
    }
  );
}
