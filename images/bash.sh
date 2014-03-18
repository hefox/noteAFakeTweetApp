a=1
for i in *.gif; do
  new=$(printf "%01d.gif" ${a}) #04 pad to length of 4
  mv "${i}" "${new}"
  let a=a+1
done