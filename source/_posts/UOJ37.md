---
title: UOJ37
date: 2019-08-12 17:16:44
tags: 
	- 容斥
	- 计数
categories: UOJ

---

# [UOJ37](http://uoj.ac/problem/37)

> ### Description
>
> 响应主旋律的号召，大家决定让这个班级充满爱，现在班级里面有 $n$ 个男生。
>
> 如果 $a$ 爱着 $b$，那么就相当于 $a$ 和 $b$ 之间有一条 $a→b$ 的有向边。如果这 $n$ 个点的图是强联通的，那么就认为这个班级是充满爱的。
>
> 不幸的是，有一些不好的事情发生了，现在每一条边都可能被摧毁。我作为爱的使者，想知道有多少种摧毁的方式，使得这个班级任然充满爱呢？（说人话就是有多少边的子集删去之后整个图仍然强联通。）
>
> ### Input
>
> 第一行两个数 $n$ 和 $m$ ，表示班级里的男生数和爱的关系数。
>
> 接下来 $m$ 行，每行两个数 $a$ 和 $b$，表示男生 $a$ 爱着男生 $b$。同时 $a$ 不等于 $b$。
>
> 所有男生从 $1$ 到 $n$ 标号。
>
> 同一条边不会出现两遍，但可能出现 $a$ 爱着 $b$，$b$ 也爱着 $a$ 的情况，这是两条不同的边。
>
> ### Output
>
> 输出一行一个整数，表示对 $10^9+7$ 取模后的答案。
>
> #### Sample Input
>
 ```
 5 15
 4 3
 4 2
 2 5
 2 1
 1 2
 5 1
 3 2
 4 1
 1 4
 5 4
 3 4
 5 3
 2 3
 1 5
 3 1
 ```
> #### Sample Output
```
9390
```
> ### Constraints
>
> 对于 $20\%$ 的数据满足: $n≤5$;
>
> 对于 $50\%$ 的数据满足: $n≤8$;
>
> 对于 $70\%$ 的数据满足: $n≤10$;
>
> 对于 $100\%$ 的数据满足: $n≤15,0≤m≤n(n−1)$。
>
> **时间限制：**1s
>
> **空间限制：**256MB

### Solution

$f[S]$ 表示把集合 $S$ 分为非强连通分量的方案数

$h_k[S]$ 表示把集合 $S$ 分为 $k$ 个 $SCC$ 的方案数

$ans[S]$ 表示把集合 $S$ 分为 $1$ 个 $SCC$ 的方案数（也即是 $h_1[S]$ ）
$$
\begin{align}
f[S]&=\sum_{\varnothing\neq T\subseteq S}(-1)^{|T|-1}\times f[T]\times 2^{edge(T,S\backslash T)}\\
&=
\sum_{\varnothing\neq T\subseteq S}\sum_{k=1}^{|T|}(-1)^{k-1}\times h_k[T]\times 2^{edge(T,S\backslash T)}\times 2^{E(S\backslash T)}
\\
&=
\sum_{\varnothing\neq T\subseteq S}g[T]\times 2^{edge(T,S\backslash T)+E(S\backslash T)}\\
定义其中的
g[S]&=
\sum_{i=1}^{max}h_{2i-1}[S]-\sum_{i=1}^{max}h_{2i}[S]\\
&=
ans[S]-\sum_{\min S\in T\subsetneq S}ans[T]\times g[S\backslash T]\\
ans[S]&=2^{E(S)}-f[S]
\end{align}
$$
对于 $edge(T,S\backslash T)$ , 令 $u=\min S\backslash T$
$$
edge(T,S\backslash T)=edge(T\cup u,(S\backslash T)\backslash u)-edge(u,(S\backslash T)\backslash u)+edge(T,u)
$$
后两项可以通过预处理一个点的出度集合和入度集合来快速计算

**Q：** 算 $f[S]$ 时要用到 $g[S]$ 但算 $g[S] $ 时不是应该加上当前的 $ans[S]$ 吗，$ans[S]$ 又要通过 $f[S]$ 求？

**A:** 想一下我们现在求的是什么：当前情况的合法状态数 $ans[S]$ 。这个要通过 $2^{E[S]}-f[S]$ 实现，那么就要把之前算的答案导致的不合法情况容斥掉，而 $g$ 的意义只是为了我们后面再算的时候降低复杂度，是我们“定义”出来的一个值，没有什么实际含义，即我们只需要算之前的 $g[T]$ 导致的不合法情况并删除，剩下的就是现在合法的情况数，然后再用这个去更新现在的 $g[S]$ 以便以后用到的时候值正确

### Code

```c++
#include<bits/stdc++.h>
#define ll long long
#define FIO "uoj37"
#define cnt(x) __builtin_popcount(x)
using namespace std;

const int N=15,N2=N*N,SN=1<<N,MOD=1e9+7;

inline int add(int a,const int &b){return (a+=b)>=MOD?a-MOD:a;}
inline int sub(int a,const int &b){return (a-=b)<   0?a+MOD:a;}
inline int mul(const int &a,const int &b){return 1ll*a*b%MOD;}
inline int& inc(int &a,const int &b){return a=add(a,b);}
inline int& dec(int &a,const int &b){return a=sub(a,b);}
inline int& pro(int &a,const int &b){return a=mul(a,b);}
inline int qpow(int a,int b){int c=1;for(;b;b>>=1,pro(a,a))if(b&1)pro(c,a);return c;}

int n,m,up;
int E[SN],f[SN],g[SN],ans[SN],bin[N2],edge[SN],id[SN],d[N][N],in[N],out[N];

int main(){
  freopen(FIO".in","r",stdin);
  freopen(FIO".out","w",stdout);

  scanf("%d%d",&n,&m);
  up=1<<n;
  for(int i=0;i<n;i++)id[1<<i]=i;
  bin[0]=1;for(int i=1;i<N2;i++)bin[i]=add(bin[i-1],bin[i-1]);

  for(int i=1,u,v;i<=m;i++)scanf("%d%d",&u,&v),d[--u][--v]++,in[v]|=1<<u,out[u]|=1<<v;

  for(int S=1;S<up;S++){
    int lst=S&-S;
    E[S]=E[S^lst]+cnt(in[id[lst]]&(S^lst))+cnt(out[id[lst]]&(S^lst));
  }

  for(int S=1;S<up;S++){
    int lst=S&-S;
    if(S==lst){
      g[S]=ans[S]=1;
      continue;
    }
    edge[S]=0;
    for(int T=(S-1)&S;T;T=(T-1)&S){
      int lst=(S^T)&-(S^T);
      edge[T]=edge[T^lst]-cnt(out[id[lst]]&(T^lst^S))+cnt(in[id[lst]]&T);
    }

    for(int T=(S^lst)&((S^lst)-1);~T;T=T?(T-1)&(S^lst):-1){
      dec(g[S],mul(ans[T^lst],g[T^lst^S]));
    }

    for(int T=S;T;T=(T-1)&S){
      inc(f[S],mul(g[T],bin[edge[T]+E[S^T]]));
    }

    inc(g[S],ans[S]=sub(bin[E[S]],f[S]));
  }

  printf("%d\n",ans[up-1]);

  return 0;
}
```

​	

