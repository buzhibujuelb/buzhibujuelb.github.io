---
title: LOJ4
mathjax: true
date: 2018-10-24 22:49:48
tags: 水题
categories: LOJ

---

# [LOJ4](https://loj.ac/problem/4)
> ### Description 
> 写一个程序，使其能输出自己的源代码。
> 代码中必须至少包含十个可见字符。
> ### Input 
> 无
> ### Output
> 你的源代码

### Solution
不是很懂为什么天天做水题=.=
复习一下常见字符$Ascii$表值
(然而背不到，可能有用的就是快读中$ch-'0'$以后可以直接用$ch\%16$（即$ch\&15$)
$$
\begin{align}
' \n'&\Leftrightarrow10 \\
'\ " \ '&\Leftrightarrow34\\
'\ '\ '&\Leftrightarrow96\\
'0'-'9'&\Leftrightarrow48-57\\
'A'-'Z'&\Leftrightarrow65-90\\
'a'-'z'&\Leftrightarrow97-122
\end{align}
$$
### Code 
简单$C++$
```c++
#include<bits/stdc++.h>
const char *str="#include<bits/stdc++.h>%cconst char *str=%c%s%c;%cint main(){printf(str,10,34,str,34,10);}";
int main(){printf(str,10,34,str,34,10);}
```
以及一份来自神仙网友的更神仙的$python$代码(。・∀・)ノ
```python
print(open(__file__).read())
```
