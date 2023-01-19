$(function () {
  // 이모지콘 넣기위해 기능이 있는지 확인
  if (!String.fromCodePoint)
    (function (stringFromCharCode) {
      var fromCodePoint = function (_) {
        var codeUnits = [],
          codeLen = 0,
          result = '';
        for (var index = 0, len = arguments.length; index !== len; ++index) {
          var codePoint = +arguments[index];
          // correctly handles all cases including `NaN`, `-Infinity`, `+Infinity`
          // The surrounding `!(...)` is required to correctly handle `NaN` cases
          // The (codePoint>>>0) === codePoint clause handles decimals and negatives
          if (!(codePoint < 0x10ffff && codePoint >>> 0 === codePoint)) throw RangeError('Invalid code point: ' + codePoint);
          if (codePoint <= 0xffff) {
            // BMP code point
            codeLen = codeUnits.push(codePoint);
          } else {
            // Astral code point; split in surrogate halves
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000;
            codeLen = codeUnits.push(
              (codePoint >> 10) + 0xd800, // highSurrogate
              (codePoint % 0x400) + 0xdc00 // lowSurrogate
            );
          }
          if (codeLen >= 0x3fff) {
            result += stringFromCharCode.apply(null, codeUnits);
            codeUnits.length = 0;
          }
        }
        return result + stringFromCharCode.apply(null, codeUnits);
      };
      try {
        // IE 8 only supports `Object.defineProperty` on DOM elements
        Object.defineProperty(String, 'fromCodePoint', {
          value: fromCodePoint,
          configurable: true,
          writable: true,
        });
      } catch (e) {
        String.fromCodePoint = fromCodePoint;
      }
    })(String.fromCharCode);
  // 이모지콘 div를 밀어넣는 부분
  $('div.chat_input div.emoji_wrap').empty();
  for (var i = 0; i < 18; i++) {
    var code = 0x1f600 + i;
    $('div.chat_input div.emoji_wrap').append($('<a>', { href: '#none' }).css({ 'font-size': '20px' }).html(String.fromCodePoint(code)));
  }
  // 이모지콘 / 키보드 아이콘 토글
  $('li.chat_input_btn').click(function (e) {
    if ($('li.chat_input_btn').hasClass('emoji')) {
      $('div.emoji_wrap').show();
      $(this).addClass('keyboard');
      $(this).removeClass('emoji');
    } else {
      $('div.emoji_wrap').hide();
      $(this).removeClass('keyboard');
      $(this).addClass('emoji');
    }
    chatHeightEdit();
  });
});
// 화면 크기 조절시 이벤트
$(window).resize(function (e) {
  chatHeightEdit();
});

function chatHeightEdit() {
  $('.chat_field').css('max-height', window.innerHeight - 70 - $('.chat_title').height() - $('.chat_input_wrap').height() - 20);
  $('div.chat_wrap div.chat_field').scrollTop($('.chat_field').prop('scrollHeight'));
}

$(function () {
  // 이모지 버튼
  $('div.chat_input div.emoji_wrap a').click(function () {
    channel.sendMessage({
      message: $(this).text(),
      mimeType: 'emoji',
    });
  });

  // 클릭 버튼
  $('div.chat_input_wrap > div.chat_input_btn_wrap > button').click(function (e) {
    channel.sendMessage({
      message: $('div.chat_input_wrap > div.chat_input > div.textbox').text(),
      mimeType: 'text',
    });
    $('div.chat_input_wrap > div.chat_input > div.textbox').text('');
    $('div.chat_input_wrap > div.chat_input > div.textbox').focus();
  });

  // 입력창 엔터
  $('div.chat_input_wrap > div.chat_input > div.textbox').keydown(function (e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      channel.sendMessage({
        message: $(this).text(),
        mimeType: 'text',
      });
      $(this).text('');
    }
  });
  $('div.chat_input_wrap > div.chat_input > div.textbox').keyup(function (e) {
    chatHeightEdit();
  });
  // 특정 유저로 메시지 전송
  let whisperLayer = $('div.pop_whisper');
  whisperLayer.close = function () {
    $('div.whisper_text_wrap > input[type=text]', whisperLayer).val('');
    $(this).hide();
  };
  $('button', whisperLayer).click(function (e) {
    channel.sendWhisper(
      {
        message: $('div.whisper_text_wrap > input[type=text]', whisperLayer).val(),
        receivedClientKey: whisperLayer.data()['clientKey'],
      },
      function (err, msg) {
        if (err) return openError(err.code);
        write(msg, 'whisperto');
      }
    );
    e.preventDefault();
    whisperLayer.close();
  });
  // 신고하기
  $('p.notify', whisperLayer).click(function (e) {
    // API 콜한다
    let url = `${BASE_URL}/api/openapi/insertChatBanUser`;

    let param = {
      room_id: whisperLayer.data()['roomId'],
      buser_nick: whisperLayer.data()['nickName'],
      buser_msg: whisperLayer.data()['message'],
      buser_chat_id: whisperLayer.data()['clientKey'],
    };
    console.log(param);
    $.post(
      url,
      param,
      function (data) {
        if (data.result_cd != 1) {
          console.log('추방 실패');
        }
      },
      'json'
    );
    whisperLayer.close();
  });
});

function chatInit() {
  $('div.chat_input_wrap > div.chat_input > p').html(channel.nickName);
  webrtc.console.debug('>>>>>>>>> 메시지 init');
  // 신규 메시지 이벤트
  channel.onNotifyMessage = function (event) {
    switch (event.mimeType) {
      case 'text':
      case 'emoji':
        if (event.grade == 'userManager') {
          write(event, 'userManager');
        } else {
          write(event);
        }
        break;
      case 'whiteboard':
        if (event.message && event.clientKey !== channel.clientKey) {
          event.message = event.message.replace(/\*/g, '5');
          const { action } = JSON.parse(event.message);
          if (action === 'open' || action === 'close') {
            fabricWrapper.buttons.canvasBtn(action);
          } else if (typeof action === 'object') {
            fabricWrapper.canvasEvent(action);
          }
        }
        break;
      case 'fileShare':
        if (event.message && event.clientKey !== channel.clientKey) {
          try {
            const { action } = JSON.parse(event.message);
            if (action === 'open' || action === 'close') {
              fileHelper.buttons.fileShareBtn(action);
            } else if (typeof action === 'object') {
              fileHelper.canvasEvent(action);
            }
          } catch (error) {
            console.warn('data >> ', event.message);
            console.error('what happend???', error);
          }
        }
        break;
      default:
        console.error('what type??', event.mimeType);
        break;
    }
  };

  // 개인 귓속말 메시지 이벤트
  channel.onPersonalWhisper = function (event) {
    write(event, 'whisper');
  };
}

function personalInit() {
  // 글쓰기 제한 이벤트
  channel.onPersonalMuteUser = function (event) {
    openError('글쓰기가 제한되었습니다.');
  };

  // 글쓰기 제한 해제 이벤트
  channel.onPersonalUnmuteUser = function (event) {
    openError('글쓰기 제한이 해제되었습니다.');
  };
}

function msgInit() {
  // 공지사항 메시지
  channel.onNotifyNotice = function (event) {
    write(event, 'notice');
  };

  // 유저 입장
  channel.onNotifyJoinUser = function (event) {
    if (channel.clientKey != event.clientKey) {
      write(event, 'join');
    }
  };

  // 유저 나감
  channel.onNotifyLeaveUser = function (event) {
    write(event, 'leave');
    webrtc.object_delete(use_list, event.clientKey);
    setTimeout(
      webrtc.re_marster_check(function (event) {
        webrtc.videoOutTag(event);
      }, event),
      200
    );
    webrtc.allUserList();
  };

  // 유저 추방
  channel.onNotifyKickUser = function (event) {
    webrtc.object_delete(use_list, event.clientKey);
    setTimeout(
      webrtc.re_marster_check(function (event) {
        webrtc.videoOutTag(event);
      }, event),
      200
    );
    webrtc.allUserList();
    // write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님이 채팅방에서 추방되었습니다.");
  };

  // 유저 추방 해제
  channel.onNotifyUnkickUser = function (event) {
    // write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님이 채팅방에서 추방 해제되었습니다.");
  };

  // 글쓰기 제한
  channel.onNotifyMuteUser = function (event) {
    // write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님의 글쓰기가 제한되었습니다.");
  };

  // 글쓰기 제한 해제
  channel.onNotifyUnmuteUser = function (event) {
    // write("'<font color='blue'><b>" + event.nickName + "</b></font>' 님의 글쓰기가 제한 해제되었습니다.");
  };
}
// $('a:nth-child(1)', $('div.custompopup'))
function openPopup(msg, callback, option) {
  var p = $('div.custompopup').hide();
  $('p:nth-child(1)', p).text(msg);
  $('a:nth-child(2)', p)
    .off()
    .click(function () {
      p.hide();
      if (typeof callback == 'function') {
        callback('확인');
      }
    });
  if (option) {
    $('a:nth-child(3)', p).hide();
  } else {
    $('a:nth-child(3)', p).show();
    $('a:nth-child(3)', p)
      .off()
      .click(function () {
        p.hide();
        if (typeof callback == 'function') {
          callback('취소');
        }
      });
  }
  p.show();
}

// 도움말 팝업 열기
$(function () {
  $('.help').click(function () {
    $('.use_help').show();
  });
});

// 도움말 팝업 닫기
$(function () {
  $('.btn_help_close').click(function () {
    $('.use_help').hide();
  });
});

// 채팅창 숨기기
$(function () {
  $('.btn_hide').click(function () {
    $('.chat_field').hide();
    $('.btn_show').addClass('show');
    $('.btn_hide').removeClass('show');
  });
});

// 채팅창 보이기
$(function () {
  $('.btn_show').click(function () {
    $('.chat_field').show();
    $('.btn_hide').addClass('show');
    $('.btn_show').removeClass('show');
  });
});

$(function () {
  // 팝업 외 마우스 클릭 시 팝업 닫힘
  $(document).mouseup(function (e) {
    let container = $('.pop_whisper');
    if (container.has(e.target).length === 0) {
      container.hide();
    }
  });

  $('div.whisper_text_wrap > input[type=text]').keydown(function (e) {
    if (e.keyCode == 13) {
      $('div.whisper_text_wrap > button').trigger('click');
    }
  });
});

function openLayer(e) {
  let sWidth = window.innerWidth;
  let sHeight = window.innerHeight;
  let oWidth = $('.pop_whisper').width();
  let oHeight = $('.pop_whisper').height();
  let fWidth = $('.chat_wrap').offset().left;
  let fHeight = $('.chat_wrap').offset().top;
  let cHeight = $('.chat_field').height();
  // 레이어가 나타날 위치를 셋팅한다.
  var divLeft = e.clientX - fWidth + $('html').scrollLeft();
  var divTop = e.clientY - fHeight + $('html').scrollTop();
  // 레이어가 화면 크기를 벗어나면 위치를 바꾸어 배치한다.
  if (divLeft + oWidth > sWidth) divLeft -= oWidth;
  if (divTop + oHeight > sHeight) divTop -= oHeight;
  if (divTop > cHeight - oHeight) {
    divTop = divTop - oHeight;
  }
  $('.pop_whisper')
    .data($(this).data())
    .css({
      top: Math.max(0, divTop),
      left: Math.max(0, divLeft),
      position: 'absolute',
    })
    .show();
  $('div.whisper_text_wrap > input').focus();
}

// 접속, 퇴장, 귓속말, 공지사항 문구 html ADD
function write(msg, tp, pre) {
  if (msg.mimeType === 'whiteboard' || msg.mimeType === 'fileShare') return;
  let cl = $('div.chat_field');
  let cc = $('<div>', { class: 'chat-content' });
  switch (tp) {
    case 'join':
      cc = $('<p>', { class: 'entery' }).html('<b>' + msg.nickName + '</b> 님이 입장하셨습니다.');
      break;
    case 'leave':
      cc = $('<p>', { class: 'exit' }).html('<b>' + msg.nickName + '</b> 님이 나가셨습니다.');
      break;
    case 'notice':
      cc = $('<p>', { class: 'notice' });
      cc.html(typeof msg == 'string' ? msg : msg.message);
      cc.prepend($('<span>', { class: 'ico_notice' }));
      break;
    case 'whisper':
      cc = $('<p>', { class: 'whisper' });
      cc.append($('<span>', { class: 'ico_whisper' }));
      cc.append($('<span>', { class: 'user_name' }).html(msg.nickName).data(msg).on({ click: openLayer }));
      cc.append(document.createTextNode('님의 귓속말'));
      cc.append($('<span>', { class: 'whisper_comment' }).html(msg.message));
      break;
    case 'whisperto':
      cc = $('<p>', { class: 'whisper' });
      cc.append($('<span>', { class: 'ico_whisper' }));
      cc.append($('<span>', { class: 'user_name' }).html(msg.nickName).data(msg).on({ click: openLayer }));
      cc.append(document.createTextNode('님에게 귓속말'));
      cc.append($('<span>', { class: 'whisper_comment' }).html(msg.message));
      break;
    case 'allExit':
      vChatCloud.disconnect();
      channel = undefined;
      $('input#name', webrtc.login).val('');
      webrtc.login.show();
      $('input', webrtc.login).focus();
      webrtc.toastPopup('채팅방이 종료되었습니다.');
      break;
    case 'userManager':
      cc = $('<p>', { class: 'comment admin' });
      if (typeof msg == 'string') {
        cc.append($('<span>', { class: 'user_name' }).html('운영자'));
        cc.append(document.createTextNode(msg));
      } else if (typeof msg == 'object' && msg.message) {
        if (channel.clientKey != msg.clientKey) {
          cc.append($('<span>', { class: 'user_name' }).html(msg.nickName).data(msg).on({ click: openLayer }));
        } else {
          cc.append($('<span>', { class: 'user_name' }).html(msg.nickName));
        }
        cc.append(document.createTextNode(msg.message));
      }
      break;
    default:
      cc = $('<p>', { class: 'comment' });
      if (typeof msg == 'string') {
        cc.append($('<span>', { class: 'user_name' }).html('사용자'));
        cc.append(document.createTextNode(msg));
      } else if (typeof msg == 'object' && msg.message) {
        if (channel.clientKey != msg.clientKey) {
          cc.append($('<span>', { class: 'user_name' }).html(msg.nickName).data(msg).on({ click: openLayer }));
        } else {
          cc.append($('<span>', { class: 'user_name' }).html(msg.nickName));
        }
        cc.append(document.createTextNode(msg.message));
      }
  }
  if (pre) {
    cl.prepend(cc);
  } else {
    cl.append(cc);
  }
  $('div.chat_wrap div.chat_field').scrollTop(cl.prop('scrollHeight'));
}
