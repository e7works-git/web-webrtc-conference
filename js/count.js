// $(function() {
//     $('#sendLike').click(function(e) {
//         var url = "https://vchatcloud.com/api/openapi/like";
//         var param = {
//             "room_id": channelKey,
//             "log_cnt": 1
//         };
//         $.post(url, param, function(data) {
//             if (data.result_cd == 1) {
//                 $('#likeCounter').html(data.like_cnt);
//             } else {
//                 console.log("조회 실패")
//             }
//         }, "json");
//     })
// });

function max_count(max) {
    webrtc.console.debug(max);
    let count = 200;
    if (max && max > 0) {
        count = max;
    }
    $('#wrap > div.chat_wrap > div.chat_subwrap > div.chat_input_wrap > div.chat_input > div.textbox').attr("placeholder", "최대 " + count + "자까지 입력 가능");
    $('div.chat_input_wrap > div.chat_input > div.textbox').keydown(function(e) {
        if ($(this).text().length > count) {
            webrtc.alert_popup({
                title: "알림",
                msg: "글자수는 " + count + "자 이내로 제한됩니다."
            }, function(res) {
                webrtc.console.debug("닫힘");
            });
            $(this).text(($(this).text()).substring(0, count));
        }
        $('div.chat_input_wrap > div.chat_input_btn_wrap > ul > li.chat_word_count').html(($(this).text()).length + '/' + count);
    });
    $('div.chat_input_wrap > div.chat_input > div.textbox').keyup(function(e) {
        if ($(this).text().length > count) {
            $(this).text(($(this).text()).substring(0, count));
        }
        $('div.chat_input_wrap > div.chat_input_btn_wrap > ul > li.chat_word_count').html(($(this).text()).length + '/' + count);
    });
    $('div.chat_input_wrap > div.chat_input > div.textbox').keyup();
}

// function likeInif() {
//     var url = "https://vchatcloud.com/api/openapi/getLike";
//     var param = {
//         "room_id": channelKey
//     };
//     $.post(url, param, function(data) {
//         if (data.result_cd == 1) {
//             $('#likeCounter').html(data.like_cnt);
//         } else {
//             console.log("조회 실패")
//         }
//     }, "json");
// }