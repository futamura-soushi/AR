var position, rotation;
var x, y, z;  //カメラの位置
var a, b, c, w; //カメラの角度（クォータニオン）
var json = {
  "UnityPosition" : [x, y, z],
  "UnityRotation" : [a, b, c, w]
};

var aX = 0, aY = 0, aZ = 0;                     // 加速度の値を入れる変数を3個用意
var alpha = 0, beta = 0, gamma = 0;
const camerawidth = 1280;
const cameraheight = 720;

let localStream;


// カメラ映像取得

navigator.mediaDevices.getUserMedia({video: true, audio: false})
  .then( stream => {
  // 成功時にvideo要素にカメラ映像をセットし、再生
  const videoElm = document.getElementById('my-video');
  videoElm.srcObject = stream;
  videoElm.play();
  // 着信時に相手にカメラ映像を返せるように、グローバル変数に保存しておく
  localStream = stream;
  // Get the video track of the camera stream
  const track = localStream.getVideoTracks()[0];

  // Get the current settings of the video track
  const settings = track.getSettings();

  // Camera resolution
  let video_width = settings.width;
  let video_height = settings.height;
  console.log(video_width)  //webcamの場合640
  console.log(video_height) //webcamの場合480

}).catch( error => {
  // 失敗時にはエラーログを出力
  console.error('mediaDevice.getUserMedia() error:', error);
  return;
});


// カメラ映像取得
// document.addEventListener('DOMContentLoaded', () => {
//   const videoElement = document.getElementById('my-video');

//   navigator.mediaDevices.getUserMedia({ video: { 
//     width: camerawidth,
//     height: cameraheight,
//     facingMode: 'environment' } })
//       .then(stream => {
//           videoElement.srcObject = stream;
//           videoElement.play();
//           localStream = stream
//       })
//       .catch(error => {
//           console.error('Error accessing rear camera:', error);
//       });
// });

    //Peer作成
    const peer = new Peer({
      key: 'd60cc56b-3de6-4412-be61-003bd3c45d3b',
      debug: 3
  });

  //PeerID取得
  peer.on('open', () => {
      document.getElementById('my-id').textContent = peer.id;
  });

  // 発信処理
document.getElementById('make-call').onclick = () => {
  const theirID = document.getElementById('their-id').value;
  const mediaConnection = peer.call(theirID, localStream, {videoCodec: 'H264'});
  setEventListener(mediaConnection);

  // 相手への接続を開始する
  const conn = peer.connect(theirID);

  // 接続が完了した場合のイベントの設定
  conn.on("open", function() {
      // timer1 = setInterval(sendInfo, 50);
  });

    // 指定時間ごとに繰り返し実行される setInterval(実行する内容, 間隔[ms]) タイマーを設定
  function sendInfo(){
    conn.send(JSON.stringify(json));
    }

};

// イベントリスナを設置する関数
const setEventListener = mediaConnection => {
  mediaConnection.on('stream', stream => {
    // video要素にカメラ映像をセットして再生
    const videoElm = document.getElementById('their-video')
    videoElm.srcObject = stream;
    videoElm.play();
  });
}

//着信処理
peer.on('call', mediaConnection => {
  mediaConnection.answer(localStream, {videoCodec: 'H264'});
  setEventListener(mediaConnection);
});

//切断処理
document.getElementById('end-call').onclick = () => {
  console.log("切断")
  mediaConnection.close(true);
}

//接続が切れたときに発火
peer.on('close', function(){
  mediaConnection.close(true);
});

   // 処理登録
AFRAME.registerComponent('marker-position', {
    tick: function () {

        var marker = this.el;

        //Marker 検知状態の確認
        if (marker.object3D.visible) {

            // Marker 座標の取得(x:画像の縦(右が+), y:画像の横(上が＋), z:画像の奥行（近づくほど＋）)相対座標
            Markerposition = marker.object3D.position;
            Markerrotation = marker.object3D.rotation;
            

            //追加_____________
            //マーカーからみたカメラの位置
            let cameraPosition = {
                x: -Markerposition.x,
                y: -Markerposition.y,
                z: -Markerposition.z
            };
        
            // マーカーから見たカメラの回転
            // 回転の逆を取る
            let markerQuaternion = new THREE.Quaternion().setFromEuler(Markerrotation); // クォータニオンに変換
            let cameraQuaternion = markerQuaternion.invert(); // 回転を反転
            // console.log("クォータニオン:", markerQuaternion);
            // console.log("逆クォータニオン:", cameraQuaternion);
            
            // Unityに送る形式に変換
            json.UnityPosition =[cameraPosition.x, cameraPosition.z, cameraPosition.y];
            unityPosition = {
                x: cameraPosition.x,
                y: cameraPosition.z,
                z: cameraPosition.y // z軸反転（AR.js→Unity座標系の変換）
            };

            json.UnityRotation = [-cameraQuaternion.x, -cameraQuaternion.y, cameraQuaternion.z, cameraQuaternion.w];
            unityRotation = {
                x: -cameraQuaternion.x,
                y: -cameraQuaternion.y,
                z: cameraQuaternion.z, 
                w: cameraQuaternion.w
            };

            // // デバッグ出力
            // console.log("Unity座標系のカメラ位置:", unityPosition);
            // console.log("Unity座標系のカメラ回転:", unityRotation);
            console.log("Unity座標系のカメラ位置:", json.UnityPosition);
            console.log("Unity座標系のカメラ回転:", json.UnityRotation);

            //_________________
        } else {
            
        }
    }
});
