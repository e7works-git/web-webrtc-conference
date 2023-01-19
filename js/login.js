const isDev = location.host == 'dev.vchatcloud.com' || location.host.includes('127.0.0.1');
const BASE_URL = `https://${isDev ? 'dev.' : ''}vchatcloud.com`;

const { FileUtil, Util } = e7lib;

const CONSTRAINTS = {
  video: {
    width: { ideal: 320 },
    height: { ideal: 240 },
  },
  audio: { echoCancellation: true, noiseSuppression: true },
};

const vChatCloud = new VChatCloud(
  {
    url: `${BASE_URL}:9001/eventbus`,
  },
  CONSTRAINTS
);

let fabricWrapper, fileHelper, webrtc;

let channel, userNick, userKey, channelKey;
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

channelKey = params.channelkey || params.channelKey;

$(function () {
  // 리소스 로드 res 변수명으로 동작
  if (webrtc === undefined) {
    webrtc = new webRTC('.toast_pop', 400, 3000, 800);
    webrtc.console.action('login.js >> ', 'init');
  }

  // 로그인 활성화
  webrtc.login.show();
  var enter = true;
  $('input', webrtc.login)
    .focus()
    .keyup(function (e) {
      if (e.keyCode == 13 && enter) {
        enter = false;
        $('button.rtc3_login_btn', webrtc.login).trigger('click');
      }
    });
  $('button.rtc3_login_btn', webrtc.login).click(function () {
    webrtc.console.action('login.js >> ', 'login start');
    let r = { nick: $('input#name', webrtc.login).val() };
    if (r.nick) {
      try {
        joinRoom(
          channelKey,
          'xxxxxxxxxxxx'.replace(/[xy]/g, function (a, b) {
            return (b = Math.random() * 16), (a == 'y' ? (b & 3) | 8 : b | 0).toString(16);
          }),
          r.nick,
          function (err, history) {
            if (err) {
              console.error(err);
              webrtc.login.hide();
              webrtc.alert_popup({ title: '오류', msg: errMsg[err.code].kor }, function () {
                webrtc.rtcLogout();
              });
            } else {
              webrtc.login.hide();
              // 기존 대화내용 삭제
              $('.chat_field > p').remove();
              // 기존 이벤트 제거
              $(window).off('keydown').off('mousemove');
              webrtc.customInit(history);
              if (fabricWrapper) fabricWrapper.reJoin();
              else fabricWrapper = new FabricWrapper();
              if (fileHelper) fileHelper.reJoin();
              else fileHelper = new FileHelper();
            }
          }
        );
      } catch (e) {
        console.error('조인 룸 오류');
      }
    }
    enter = true;
  });
});

// room 에 조인
function joinRoom(roomId, clientKey, nickName, callback) {
  // vchatcloud 객체
  channel = vChatCloud.joinChannel(
    {
      roomId: roomId,
      clientKey: clientKey,
      nickName: nickName,
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
