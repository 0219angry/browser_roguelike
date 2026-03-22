# ブランチ名のルール
ブランチ名	役割	派生元	マージ先
master	　公開するものを置くブランチ		ここのブランチの環境でリリースされます。ブランチの起点みたいなイメージ
develop	開発中のものを置くブランチ　(このdevelppブランチからfeatureなどブランチを切っていきます)	master	master
release	次にリリースするものを置くブランチ	develop	develop, master
feature-*	　新機能開発中に使うブランチ	　develop	　　develop
hotfix-*	公開中のもののバグ修正用ブランチ	master	　develop,　master

## 補足
1. feature-〇〇やhotfix-〇〇で、〇〇には適当な名前をつける
2. いきなりmasterからブランチを切って作業はないので、developブランチはmasterブランチのクッションのような役割
これらが命名規則になるので現場にこれから入る方は気をつけましょう。

# コミットコメントのルール

変更内容や実装内容が分かりやすいよう日本語で説明する。

