list=$(ls ./official)
args=''

if [ "$1" = "dev" ]; then
  args='-o -d'
fi

set --
for file in $list; do
  set -- "$@" "official/$file"
done

echo "building official adapters with args: $args"
tsx scripts/build.ts $args "$@"
