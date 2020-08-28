title: 动态DP
mathjax: true
tags:
  - DP
  - 动态DP
categories: 总结
date: 2018-12-08 00:24:00

---

从$NOIPD2T3$发现的神仙玩意，虽然可能没啥用但还是试试学一学顺便练练码力。

---
##  [保卫王国](https://www.luogu.org/problemnew/show/P5024)
> ### Description
> Z国有$n$ 座城市，$n-1$ 条双向道路，每条双向道路连接两座城市，且任意两座城市
> 都能通过若干条道路相互到达。
> Z国的国防部长小Z要在城市中驻扎军队。驻扎军队需要满足如下几个条件：
> ● 一座城市可以驻扎一支军队，也可以不驻扎军队。
> ● 由道路直接连接的两座城市中至少要有一座城市驻扎军队。
> ● 在城市里驻扎军队会产生花费，在编号为$i$的城市中驻扎军队的花费是$p_i$ 。
> 小Z很快就规划出了一种驻扎军队的方案，使总花费最小。但是国王又给小Z提出
> 了$m$个要求，每个要求规定了其中两座城市是否驻扎军队。小Z需要针对每个要求逐一
> 给出回答。具体而言，如果国王提出的第$j$个要求能够满足上述驻扎条件（不需要考虑
> 第$j$个要求之外的其它要求），则需要给出在此要求前提下驻扎军队的最小开销。如果
> 国王提出的第$j$个要求无法满足，则需要输出$-1$ $(1\leq j\leq m)$ 。现在请你来帮助小Z。
>
> ### Input
> 第 $1$ 行包含两个正整数$n,m$和一个字符串$type$，分别表示城市数、要求数和数据类型。$type$是一个由大写字母 $A$，$B$ 或 $C$ 和一个数字 $1$，$2$，$3$ 组成的字符串。它可以帮助你获得部分分。你可能不需要用到这个参数。这个参数的含义在【数据规模与约定】中 有具体的描述。
> 第 $2$ 行$n$个整数$p_i$ 表示编号$i$的城市中驻扎军队的花费。
> 接下来 $n−1$ 行，每行两个正整数$u,v$，表示有一条uu到vv的双向道路。
> 接下来 $m$ 行，第$j$行四个整数$a,x,b,y(a ≠ b)$，表示第$j$个要求是在城市$a$驻扎$x$支军队， 在城市$b$驻扎$y$支军队。其中，$x$、$ y$ 的取值只有$0$或$1$：若$x$ 为$0$，表示城市$a$ 不得驻 扎军队，若$x$ 为$1$，表示城市$a$ 必须驻扎军队；若$y$为$0$，表示城市$b$不得驻扎军队， 若$ y$为$1$，表示城市$b$ 必须驻扎军队。
> 输入文件中每一行相邻的两个数据之间均用一个空格分隔。
>
> ### Output
> 输出共 $m$ 行，每行包含 $1$ 个整数，第$j$行表示在满足国王第$j$个要求时的最小开销， 如果无法满足国王的第$j$个要求，则该行输出 $−1$。
>
> ### Sample Input
```
5 3 C3 
2 4 1 3 9 
1 5 
5 2 
5 3 
3 4 
1 0 3 0 
2 1 3 1 
1 0 5 0
```
>### Sample Output
```
12 
7 
-1
```
>### Hint
>【样例解释】
>对于第一个要求，在$4$ 号和 $5$ 号城市驻扎军队时开销最小。
>对于第二个要求，在 $1$ 号、$2$ 号、$3$ 号城市驻扎军队时开销最小。
>第三个要求是无法满足的，因为在 $1$ 号、$5$ 号城市都不驻扎军队就意味着由道路直接连 接的两座城市中都没有驻扎军队。
>【数据规模与约定】
>对于 $100\%$的数据，$n,m ≤ 100000,1 ≤ p_i ≤ 100000$
>![数据规模](https://cdn.luogu.org/upload/pic/43261.png)
>数据类型的含义：
>$A$：城市ii与城市$i +1$直接相连。
>$B$：任意城市与城市 $1$ 的距离不超过 $100$（距离定义为最短路径上边的数量），即如果这棵树以 $1$ 号城市为根，深度不超过 $100$。
>$C$：在树的形态上无特殊约束。
>$1$：询问时保证$a = 1,x = 1$即要求在城市 $1$ 驻军。对$b,y$没有限制。
>$2$：询问时保证$a,b$是相邻的（由一条道路直接连通）
>$3$：在询问上无特殊约束。

### Solution
考场上并不会，前几天先写了个简简单单的倍增~~然后就草到榜一~~，主要就是比一般倍增记自己状态外多记$2^{i-1}$父亲是否取的状态，这样才能转移
$$
\begin{align}
f[u][i][0/1][0/1]&表示u的2^i级祖先在u是否取及u的2^i级祖先是否取时的答案\\
转移即是
&\quad f[u][i-1][0/1（u是否取）][0/1（2^{i-1}级祖先是否取）]\\
&+f[u的2^{i-1}级祖先][i-1][0/1（2^{i-1}级祖先是否取)][0/1(2^{i}级祖先是否取)]\\
&=f[u][i][0/1(u是否取)][0/1（2^i级祖先是否取)]\\
边界情况i=0&时即自己和父亲\\
&f[u][0][0][0]=INF;\\
&f[u][0][1][0]=dp[p][0];\\
&f[u][0][1][1]=dp[p][1]-min(dp[u][0],dp[u][1])+dp[u][1];\\
&f[u][0][0][1]=dp[p][1]-min(dp[u][0],dp[u][1])+dp[u][0];\\
\end{align}
$$
查询时像求$LCA$一样往上倍增即可还有注意到计算方法是先减去原来这条链的答案再加现在这条链的答案。（搞不清楚循环咋搞的可以循环展开）可能会快个$200ms$左右并不太大影响记得数组不要开小以及$long\ long$就行~~居然没调很久2A~~。

### Code
```c++
#include<bits/stdc++.h>
#define FIO "defense"
#define ll long long
using namespace std;
const int N=1e5+5;
const ll INF=1e15;
char type[5];
int w[N],n,m,u,v,dep[N],x,y;
int ecnt,head[N],nxt[N<<1],to[N<<1],fa[N][18];
ll dp[N][2],f[N][18][2][2],cur[2][2],tmp[2][2];
inline void add(int u,int v){nxt[++ecnt]=head[u];head[u]=ecnt;to[ecnt]=v;}
inline void dfs1(int u,int p){
	fa[u][0]=p;dp[u][1]=w[u];dep[u]=dep[p]+1;
	for(int i=1;i<18;i++)fa[u][i]=fa[fa[u][i-1]][i-1];
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^p){dfs1(v,u);dp[u][0]+=dp[v][1];dp[u][1]+=min(dp[v][0],dp[v][1]);}
}
inline void dfs2(int u,int p){
		f[u][0][0][0]=INF;
		f[u][0][1][0]=dp[p][0];
		f[u][0][1][1]=dp[p][1]-min(dp[u][0],dp[u][1])+dp[u][1];
		f[u][0][0][1]=dp[p][1]-min(dp[u][0],dp[u][1])+dp[u][0];
	for(int i=1;i<18;i++){
		int t=fa[u][i-1];		  
		f[u][i][0][0] = min(f[t][i-1][0][0]-dp[t][0]+f[u][i-1][0][0], f[t][i-1][1][0]-dp[t][1]+f[u][i-1][0][1]);
     f[u][i][1][0] = min(f[t][i-1][0][0]-dp[t][0]+f[u][i-1][1][0], f[t][i-1][1][0]-dp[t][1]+f[u][i-1][1][1]);
     f[u][i][0][1] = min(f[t][i-1][0][1]-dp[t][0]+f[u][i-1][0][0], f[t][i-1][1][1]-dp[t][1]+f[u][i-1][0][1]);
     f[u][i][1][1] = min(f[t][i-1][0][1]-dp[t][0]+f[u][i-1][1][0], f[t][i-1][1][1]-dp[t][1]+f[u][i-1][1][1]);
        /*
        等价于
		for(int j=0;j<=1;j++)
		for(int k=0;k<=1;k++)
			f[u][i][j][k]=min(f[t][i-1][0][k]-dp[t][0]+f[u][i-1][j][0],f[t][i-1][1][k]-dp[t][1]+f[u][i-1][j][1]);
        */
		}
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^p)dfs2(v,u);
}
int main(){
	freopen(FIO".in","r",stdin);
	freopen(FIO".out","w",stdout);
	scanf("%d%d%s",&n,&m,type);
	for(int i=1;i<=n;i++)scanf("%d",&w[i]);
	for(int i=1;i<n;i++)scanf("%d%d",&u,&v),add(u,v),add(v,u);
	dfs1(1,0);dfs2(1,0);
	while(m--){
		scanf("%d%d%d%d",&u,&x,&v,&y);
		if(!x&&!y&&(fa[u][0]==v||fa[v][0]==u)){puts("-1");continue;}
		if(dep[u]<dep[v])swap(u,v),swap(x,y);
		cur[0][0]=x?INF:dp[u][0];
		cur[0][1]=x?dp[u][1]:INF;
		cur[1][0]=y?INF:dp[v][0];
		cur[1][1]=y?dp[v][1]:INF;
		for(int i=17;~i;i--)if(dep[fa[u][i]]>=dep[v]){
			tmp[0][0]=min(f[u][i][0][0]-dp[u][0]+cur[0][0],f[u][i][1][0]-dp[u][1]+cur[0][1]);
			tmp[0][1]=min(f[u][i][0][1]-dp[u][0]+cur[0][0],f[u][i][1][1]-dp[u][1]+cur[0][1]);
			cur[0][0]=tmp[0][0];cur[0][1]=tmp[0][1];
			u=fa[u][i];
		}
		if(u==v){
			if(y)cur[0][0]=INF;else cur[0][1]=INF;
		}else{
            
			for(int i=17;~i;i--)if(fa[u][i]^fa[v][i]){
					tmp[0][0]=min(f[u][i][0][0]-dp[u][0]+cur[0][0],f[u][i][1][0]-dp[u][1]+cur[0][1]);
					tmp[0][1]=min(f[u][i][0][1]-dp[u][0]+cur[0][0],f[u][i][1][1]-dp[u][1]+cur[0][1]);
					tmp[1][0]=min(f[v][i][0][0]-dp[v][0]+cur[1][0],f[v][i][1][0]-dp[v][1]+cur[1][1]);
					tmp[1][1]=min(f[v][i][0][1]-dp[v][0]+cur[1][0],f[v][i][1][1]-dp[v][1]+cur[1][1]);
					/*
					等价于
					for(int j=0;j<=1;j++)
					for(int k=0;k<=1;k++)
						tmp[j][k]=min(f[j?v:u][i][0][k]-dp[j?v:u][0]+cur[j][0],f[j?v:u][i][1][k]-dp[j?v:u][1]+cur[j][1]);
					*/
					memcpy(cur,tmp,sizeof cur);
					u=fa[u][i];v=fa[v][i];
				}
			int p=fa[u][0];
			tmp[1][0]=dp[p][0]-dp[u][1]-dp[v][1];
			tmp[1][1]=dp[p][1]-min(dp[v][0],dp[v][1])-min(dp[u][0],dp[u][1]);
			tmp[0][0]=tmp[1][0]+cur[0][1]+cur[1][1];
			tmp[0][1]=tmp[1][1]+min(cur[0][0],cur[0][1])+min(cur[1][0],cur[1][1]);
			cur[0][0]=tmp[0][0];cur[0][1]=tmp[0][1];u=p;
		}
		for(int i=17;~i;i--)if(fa[u][i]){
			tmp[0][0]=min(f[u][i][0][0]-dp[u][0]+cur[0][0],f[u][i][1][0]-dp[u][1]+cur[0][1]);
			tmp[0][1]=min(f[u][i][0][1]-dp[u][0]+cur[0][0],f[u][i][1][1]-dp[u][1]+cur[0][1]);
			cur[0][0]=tmp[0][0];cur[0][1]=tmp[0][1];u=fa[u][i];
		}
		printf("%lld\n",min(cur[0][0],cur[0][1]));
	}
	return 0;
}
```
然后就是本文主角 ~~(出场这么晚)~~的动态$DP$(**动态动态规划**orz)的做法，其实就是链剖然后用线段树维护矩阵。

注意转移轻链时的情况怎么写的。然而比倍增慢太多不开$O2$洛谷上T翻了$(72)$~~其实是我写的丑~~。以及开$LL$(好奇会不会有考场上写正解忘开$LL$见祖宗的神犇)

### Code
```c++
#include<bits/stdc++.h>
#define FIO "defense"
#define ll long long
using namespace std;
const int N=1e5+5;
ll INF=1e15,F[2]={INF,-INF};
char type[5];
int n,m,u,v,x,y;
int ecnt,head[N],nxt[N<<1],to[N<<1],fa[N],top[N];
ll w[N],dp[N][2];
int id[N],rnk[N],cnt,son[N],sz[N],len[N];
inline void add(int u,int v){nxt[++ecnt]=head[u];head[u]=ecnt;to[ecnt]=v;}
inline void dfs1(int u,int p){
	fa[u]=p;dp[u][1]=w[u];sz[u]=1;
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^p){
		dfs1(v,u);sz[u]+=sz[v];if(!son[u]||sz[v]>sz[son[u]])son[u]=v;
		dp[u][0]+=dp[v][1];dp[u][1]+=min(dp[v][0],dp[v][1]);
	}
}
inline void dfs2(int u,int t){
	len[t]++;id[u]=++cnt;rnk[cnt]=u;top[u]=t;if(son[u])dfs2(son[u],t);
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]&&v^son[u])dfs2(v,v);
}
//id[u]=i rnk[i]=u
#define mid ((l+r)>>1)
#define lk (k<<1)
#define rk (k<<1|1)
struct matrix{
	ll v[2][2];
	matrix(){v[0][0]=v[0][1]=v[1][0]=v[1][1]=INF;}
		inline ll *operator [](int x){return v[x];}
	matrix operator *(matrix t){
		matrix ret;
		for(int i=0;i<2;i++)for(int j=0;j<2;j++)for(int k=0;k<2;k++)ret[i][j]=min(ret[i][j],v[i][k]+t[k][j]);
		return ret;
	}
}a[N<<2],val[N];
inline void pushup(int k){a[k]=a[lk]*a[rk];}
inline void build(int k,int l,int r){
	if(l==r){
		ll &g0=a[k][0][1],&g1=a[k][1][0];
		g0=0;g1=w[rnk[l]];
		for(int u=rnk[l],i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]&&v^son[u])
			g0+=dp[v][1],g1+=min(dp[v][0],dp[v][1]);
		a[k][1][1]=g1;
		val[l]=a[k];
		return;
	}
	build(lk,l,mid);build(rk,mid+1,r);
	pushup(k);
}
inline matrix qry(int k,int l,int r,int ql,int qr){
	if(ql<=l&&r<=qr)return a[k];
	if(qr<=mid)return qry(lk,l,mid,ql,qr);
	if(mid<ql)return qry(rk,mid+1,r,ql,qr);
	return qry(lk,l,mid,ql,mid)*qry(rk,mid+1,r,mid+1,qr);
}
inline matrix qry(int u){return qry(1,1,n,id[u],id[u]+len[u]-1);}
inline void modify(int k,int l,int r,int pos){
	if(l==r){a[k]=val[l];return;}
	if(pos<=mid)modify(lk,l,mid,pos);
	else modify(rk,mid+1,r,pos);
	pushup(k);
}
#undef mid
#undef lk
#undef rk
inline void modify(int u,ll x){
	val[id[u]][1][0]+=x-w[u];val[id[u]][1][1]=val[id[u]][1][0];w[u]=x;
	matrix pre,nxt;
	while(u){
		pre=qry(top[u]);
		modify(1,1,n,id[u]);
		nxt=qry(top[u]);
		u=fa[top[u]];
		val[id[u]][0][1]+=nxt[1][1]-pre[1][1];
		val[id[u]][1][0]+=min(nxt[0][1],nxt[1][1])-min(pre[0][1],pre[1][1]);
		val[id[u]][1][1]=val[id[u]][1][0];
	}
}
int main(){
	freopen(FIO".in","r",stdin);
	freopen(FIO".out","w",stdout);
	scanf("%d%d%s",&n,&m,type);
	for(int i=1;i<=n;i++)scanf("%lld",&w[i]);
	for(int i=1;i<n;i++)scanf("%d%d",&u,&v),add(u,v),add(v,u);
	dfs1(1,0);	dfs2(1,1);
	build(1,1,n);
	while(m--){
		scanf("%d%d%d%d",&u,&x,&v,&y);
		if(!x&&!y&&(fa[u]==v||fa[v]==u)){puts("-1");continue;}
		int tmp1=w[u],tmp2=w[v];
		modify(u,F[x]);modify(v,F[y]);
		matrix ans=qry(1);
		printf("%lld\n",min(ans[0][1],ans[1][1])+(x?tmp1-F[x]:0)+(y?tmp2-F[y]:0));
		modify(u,tmp1);modify(v,tmp2);
	}
	return 0;
}

```
---
## [洛谷4719](https://www.luogu.org/problemnew/show/P4719)
> ### Description 
> 给定一棵$n$个点的树，点带点权。
> 有$m$次操作，每次操作给定$x,y$表示修改点$x$的权值为$y$。
> 你需要在每次操作之后求出这棵树的最大权独立集的权值大小。
> ### Input
> 第一行，$n,m$分别代表点数和操作数。
> 第二行，$V_1,V_2,...,V_n$ 代表$n$个点的权值。
> 接下来$n-1$行，$x,y$,描述这棵树的$n-1$条边。
> 接下来$m$行，$x,y$,修改点$x$的权值为$y$。
>
> ### Output
> 对于每个操作输出一行一个整数，代表这次操作后的树上最大权独立集。
> 保证答案在$int$范围内
>
> ### Hint
>
> 对于$30\%$的数据，$1\leq n,m\leq 10$
>
> 对于$60\%$的数据，$1\leq n,m\leq 1000$
>
> 对于$100\%$的数据，$1\leq n,m\leq 10^5$

### Solution

动态$DP$求树上最大权独立集板子，想法类似刚才那道题。
所以$NOIP$考$NOIplus$吗?![毒瘤1](https://s1.ax1x.com/2018/12/09/FG1TOI.jpg)
注意什么时候是$[1][0]$什么时候是$[0][1]$不要搞反以及矩阵初值是零不是$-inf$就好(鬼知道这两个东西我找了多久)

### Code
```c++
#include<bits/stdc++.h>
#define FIO "P4719"
using namespace std;
const int N=1e5+5,INF=1e9;
int w[N],n,m,top[N],rnk[N],id[N],cnt,x,y,f[N][2];
int head[N],nxt[N<<1],to[N<<1],ecnt,sz[N],son[N],fa[N],len[N];
namespace tree{
	inline void add(int u,int v){nxt[++ecnt]=head[u];head[u]=ecnt;to[ecnt]=v;}
	inline void dfs1(int u){
		sz[u]=1;f[u][1]=max(w[u],0);
		for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]){
			fa[v]=u;dfs1(v);sz[u]+=sz[v];
			f[u][0]+=max(f[v][0],f[v][1]);f[u][1]+=f[v][0];
		 	if(!son[u]||sz[v]>sz[son[u]])son[u]=v;
	 }
	}
	inline void dfs2(int u,int t){
		rnk[++cnt]=u;id[u]=cnt;top[u]=t;len[t]++;
		if(son[u])dfs2(son[u],t);
		for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]&&v^son[u])dfs2(v,v);
	}
	inline void build(){
		for(int i=1;i<n;i++)scanf("%d%d",&x,&y),add(x,y),add(y,x);
		dfs1(1);dfs2(1,1);
	}
}
namespace seg{
	struct matrix{
		int v[2][2];
		matrix(){v[0][0]=v[0][1]=v[1][0]=v[1][1]=0;}
		inline int *operator[](int x){return v[x];}
		matrix operator *(matrix t){
			matrix ret;
			for(int i=0;i<2;i++)for(int j=0;j<2;j++)for(int k=0;k<2;k++)ret[i][j]=max(ret[i][j],v[i][k]+t[k][j]);
			return ret;
		}
		inline void out(){
			printf("%d %d\n%d %d\n-----\n",v[0][0],v[0][1],v[1][0],v[1][1]);
		}
	}a[N<<2],val[N];
#define mid ((l+r)>>1)
#define lk (k<<1)
#define rk (k<<1|1)
	inline void pushup(int k){a[k]=a[lk]*a[rk];}
	inline void build(int k,int l,int r){
		if(l==r){
			int	&g0=a[k][0][0],&g1=a[k][1][0];
			g0=0;g1=w[rnk[l]];
			for(int u=rnk[l],i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]&&v^son[u])
				g0+=max(f[v][0],f[v][1]),g1+=f[v][0];
			a[k][0][1]=g0;
			val[l]=a[k];
			return;
		}
		build(lk,l,mid);build(rk,mid+1,r);
		pushup(k);
	}
	inline matrix qry(int k,int l,int r,int ql,int qr){
		if(ql<=l&&r<=qr)return a[k];
		if(qr<=mid)return qry(lk,l,mid,ql,qr);
		if(mid<ql)return qry(rk,mid+1,r,ql,qr);
		return qry(lk,l,mid,ql,mid)*qry(rk,mid+1,r,mid+1,qr);
	}
	inline void modify(int k,int l,int r,int pos){
		if(l==r){a[k]=val[l];return;}
		if(pos<=mid)modify(lk,l,mid,pos);else modify(rk,mid+1,r,pos);
		pushup(k);
	}
	inline void output(int k,int l,int r){
		if(l==r){printf("%d~%d\n",l,r);	a[k].out();return;}
		output(lk,l,mid);output(rk,mid+1,r);
		printf("%d~%d\n",l,r);	a[k].out();
	}
	//id[u]=i rnk[i]=u
#undef mid
#undef lk
#undef rk
	inline matrix qry(int u){return qry(1,1,n,id[u],id[u]+len[u]-1);}
	inline void modify(int u,int v) {
		val[id[u]][1][0]+=v-w[u];
		w[u]=v;
		matrix pre,nxt;
		while(u){
			pre=qry(top[u]);
			modify(1,1,n,id[u]);
			nxt=qry(top[u]);
			u=fa[top[u]];
			val[id[u]][0][0]+=max(nxt[0][0],nxt[1][0])-max(pre[0][0],pre[1][0]);
			val[id[u]][0][1]=val[id[u]][0][0];
			val[id[u]][1][0]+=nxt[0][0]-pre[0][0];
		}
	}
}
int main(){
	freopen(FIO".in","r",stdin);
	freopen(FIO".out","w",stdout);
	scanf("%d%d",&n,&m);
	for(int i=1;i<=n;i++)scanf("%d",&w[i]);
	tree::build();
	seg::build(1,1,n);
	while(m--){
		scanf("%d%d",&x,&y);
		seg::modify(x,y);
	//seg::output(1,1,n);
		seg::matrix ans=seg::qry(1);
		printf("%d\n",max(ans[0][0],ans[1][0]));
	}
	return 0;
}

```
---
## [洛谷p4751](https://www.luogu.org/problemnew/show/P4751)
> ### Description 
> 同上题，强制在线 
>
> ### Hint
>$n\leq1∗10^6$,$m \leq 3*10^6$
>  ![毒瘤2](https://s1.ax1x.com/2018/12/09/FG1Hmt.jpg)

### Solution
（这难度咋跟上一道一样啊=.=可能是没有更高的了吧？？？）~~然而你谷日常入门难度打NOI+~~。

卡强制在线的毒瘤玩意，不过之前也不会什么离线乱搞算法，但是之前的树剖$log^2n$肯定$GG$于是学习了一下一个叫**全局平衡二叉树**的毒瘤玩意

主要想法就是考虑为什么树剖不行？$\sqrt n$个大小为$\sqrt n$的节点组成一个二叉树（堆状树）就完美挂掉了，据说对每条重链开一颗线段树可以过，但是现在好像被出题人改数据后过不了，然后又对前$500$个询问离线下来加点权使得更接近中点结果也被卡了。~~数据加强了这么几次导致我做这题的时候写正解也被卡了~~

回到这题，本来除了链剖还有一种$LCT$的做法，可惜常数太大过不了这题，而且这题平衡树可以不用改变形态，那么这传说中的**全局平衡二叉树**究竟是个什么玩意？

主要思想是先链剖，然后对于每条重链找重心建平衡树，不过每个点的权重是轻儿子的个数$+1$，找到这个中心后重链左右两边再递归建下去就行，这样整颗平衡树的深度是$log$级别的。

为什么？

如果是重链上的父子，每次向上跳的时候子树大小（这里的子树都是平衡树上的子树，以下类同）至少乘二，（最小的情况是原树这一条链上没有任何其他节点即没有轻儿子），然后对于非重链上的父子，每次向上跳的时候子树大小也会严格大于当前子树大小乘二（因为原树上它父亲至少还有一个重儿子大小大于当前子树大小，不然它就成重儿子了），所以每次在平衡树边向上跳时子树大小都至少乘二，所以总的高度是$log$级别。注意到是平衡树不是线段树所以``pushutp``时要$a[lk]\times b[k]\times a[rk]$而不是$a[lk]\times a[rk]$
```c++
//初始化
inline void init(int k){
	b[k][0][0]=b[k][0][1]=dp[k][0];b[k][1][0]=dp[k][1];
}
//建二叉树
inline int build2(int l,int r){
	if(l>r)return 0;
	int sum=0;
	for(int i=l;i<=r;i++)sum+=sz[st[i]];
	for(int i=l,k=st[i],cur=sz[k];i<=r;i++,k=st[i],cur+=sz[k])if((cur<<1)>=sum){
		lk=build2(l,i-1);rk=build2(i+1,r);
		fa[lk]=fa[rk]=k;pushup(k);
		return k;
	}
	return 0;
}
//建原树
inline int build(int x,int t){
	for(int u=x;u;t=u,u=son[u]){
		for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^t&&v^son[u])fa[build(v,u)]=u;
		init(u);
	}
	cnt=0;
	for(int u=x;u;u=son[u])
		st[++cnt]=u,sz[u]-=sz[son[u]];
	return build2(1,cnt);
}
```

还有注意到这题卡常，大输入输出优化+循环展开+自定义``max``才过的...

### Code

```c++
#include<bits/stdc++.h>
#define FIO "p4751"
using namespace std;
const int N=1e6+5,INF=1e9;
inline int maxx(int a,int b){return a>b?a:b;}
int w[N],n,m,x,y,lst,dp[N][2],fa[N],sz[N],son[N],rt,ch[N][2];
int head[N],nxt[N<<1],to[N<<1],ecnt,cnt,st[N];
char buf[1<<20];int bufl,bufr;
#define getch ((bufl^bufr||(bufl=0,bufr=fread(buf,1,1<<20,stdin)))?buf[bufl++]:EOF)
template <class T>inline void read(T &x){T f=1;x=0;char ch=getch;for(;!isdigit(ch)&&ch!='-';ch=getch);if(ch=='-')f=-1,ch=getch;for(;isdigit(ch);ch=getch)x=x*10+ch-'0';x*=f;}
char ss[30000010],tt[20];int ssl,ttl;
inline int print(int x){
    if(!x) ss[++ssl]='0';for(ttl=0;x;x/=10) tt[++ttl]=char(x%10+'0');
    for(;ttl;ttl--) ss[++ssl]=tt[ttl];return ss[++ssl]='\n';
}
inline void add(int u,int v){nxt[++ecnt]=head[u];head[u]=ecnt;to[ecnt]=v;}
inline void dfs1(int u,int t){
	sz[u]=1;dp[u][1]=w[u];
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^t){
		dfs1(v,u);sz[u]+=sz[v];
		dp[u][0]+=maxx(dp[v][0],dp[v][1]);
		dp[u][1]+=dp[v][0];
		if(!son[u]||sz[son[u]]<sz[v])son[u]=v;
	}
}
inline void dfs2(int u,int t){
		if(!son[u])return;
		dp[u][0]-=maxx(dp[son[u]][0],dp[son[u]][1]);
		dp[u][1]-=dp[son[u]][0];
		for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^t) dfs2(v,u);
}

struct matrix{
	int v[2][2];
	inline int* operator [](int x){return v[x];}
	matrix(){v[0][0]=v[0][1]=v[1][0]=v[1][1]=-INF;}
	matrix operator *(matrix &t){
		matrix ret;
		ret[0][0]=maxx(v[0][0]+t[0][0],v[0][1]+t[1][0]);
		ret[0][1]=maxx(v[0][0]+t[0][1],v[0][1]+t[1][1]);
		ret[1][0]=maxx(v[1][0]+t[0][0],v[1][1]+t[1][0]);
		ret[1][1]=maxx(v[1][0]+t[0][1],v[1][1]+t[1][1]);
		return ret;
	}
	void out(){printf("%d %d\n%d %d\n-----\n",v[0][0],v[0][1],v[1][0],v[1][1]);}
}a[N],b[N];
#define lk ch[k][0]
#define rk ch[k][1]
inline void init(int k){
	b[k][0][0]=b[k][0][1]=dp[k][0];b[k][1][0]=dp[k][1];
}
inline void pushup(int k){
	a[k]=a[lk]*b[k]*a[rk];}
inline int build2(int l,int r){
	if(l>r)return 0;
	int sum=0;
	for(int i=l;i<=r;i++)sum+=sz[st[i]];
	for(int i=l,k=st[i],cur=sz[k];i<=r;i++,k=st[i],cur+=sz[k])if((cur<<1)>=sum){
		lk=build2(l,i-1);rk=build2(i+1,r);
		fa[lk]=fa[rk]=k;pushup(k);
		return k;
	}
	return 0;
}
inline void modify(int u,int x){
	dp[u][1]+=x-w[u];w[u]=x;
	int pre[2],nxt[2];
	for(;u;u=fa[u]){
		pre[0]=maxx(a[u][0][0],a[u][0][1]);
		pre[1]=maxx(a[u][1][0],a[u][1][1]);
		init(u);pushup(u);
		nxt[0]=maxx(a[u][0][0],a[u][0][1]);
		nxt[1]=maxx(a[u][1][0],a[u][1][1]);
		if(u^ch[fa[u]][0]&&u^ch[fa[u]][1]){
			dp[fa[u]][0]+=maxx(nxt[0],nxt[1])-maxx(pre[0],pre[1]);
			dp[fa[u]][1]+=nxt[0]-pre[0];
		}
	}
}
#undef lk
#undef rk
inline int build(int x,int t){
	for(int u=x;u;t=u,u=son[u]){
		for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^t&&v^son[u])fa[build(v,u)]=u;
		init(u);
	}
	cnt=0;
	for(int u=x;u;u=son[u])
		st[++cnt]=u,sz[u]-=sz[son[u]];
	return build2(1,cnt);
}
int main(){
	freopen(FIO".in","r",stdin);
	freopen(FIO".out","w",stdout);
	read(n);read(m);
	for(int i=1;i<=n;i++)read(w[i]);
	for(int i=1;i<n;i++)read(x),read(y),add(x,y),add(y,x);
	dfs1(1,0);dfs2(1,0);
    //左右儿子为空时的的判断
	a[0][0][0]=a[0][1][1]=0;a[0][0][1]=a[0][1][0]=-INF;
	rt=build(1,0);
	while(m--){
		read(x);read(y);
		x^=lst;
		modify(x,y);
		print(lst=(maxx(maxx(a[rt][0][0],a[rt][0][1]),maxx(a[rt][1][0],a[rt][1][1]))));
	}
	return fwrite(ss+1,sizeof(char),ssl,stdout),0;
}
```
---
## [BZOJ4712](https://lydsy.com/JudgeOnline/problem.php?id=4712)

>### Description
>小A走到一个山脚下，准备给自己造一个小屋。这时候，小A的朋友（op，又叫管理员）打开了创造模式，然后飞到山顶放了格水。于是小A面前出现了一个瀑布。作为平民的小A只好老实巴交地爬山堵水。那么问题来了：我们把这个瀑布看成是一个$n$个节点的树，每个节点有权值（爬上去的代价）。小A要选择一些节点，以其权值和作为代价将这些点删除（堵上），使得根节点与所有叶子结点不连通。问最小代价。不过到这还没结束。小A的朋友觉得这样子太便宜小A了，于是他还会不断地修改地形，使得某个节点的权值发生变化。不过到这还没结束。小A觉得朋友做得太绝了，于是放弃了分离所有叶子节点的方案。取而代之的是，每次他只要在某个子树中（和子树之外的点完全无关）。于是他找到你。
> ### Input
> 输入文件第一行包含一个数$n$，表示树的大小。
> 接下来一行包含$n$个数，表示第$i$个点的权值。
> 接下来$n-1$行每行包含两个数$fr$，$to$。表示书中有一条边（$fr$，$to$）。
> 接下来一行一个整数，表示操作的个数。
> 接下来$m$行每行表示一个操作，若该行第一个数为$Q$，则表示询问操作，后面跟一个参数$x$，表示对应子树的根；若为$C$，则表示修改操作，后面接两个参数$x$，$to$，表示将点$x$的权值加上$to$。
> $n<=200000$，保证任意$to$都为非负数
>
>### Output
>
> 对于每次询问操作，输出对应的答案，答案之间用换行隔开。
>
>### Sample Input
```
4
4 3 2 1
1 2
1 3
4 2
4
Q 1
Q 2
C 4 10
Q 1
```
> ### Sample Output
```c++
3
1
4
```

### Solution
矩阵转移
$$
\begin{equation}
	g[u]=\sum_{v是u的轻儿子}{f[v]}\\
	\left[
		\begin{matrix}
			f[u]\\
			0\\
		\end{matrix}
    \right]
    =\left[
	    \begin{matrix}
   			 g[u]&w[u]\\
   			 0&0\\
   	 	\end{matrix}
   	 \right]\times 
    \left[
        \begin{matrix}
        f[son[u]\\
        0\\
        \end{matrix}
     \right]
\end{equation}
$$
注意``qry``时是``id[u],id[top[u]+len[u]-1]``不是``id[top[u],id[top[u]+len[u]-1]``

还有$g[u]$不能直接用$f[u]-f[son[u]]$，原因...很浅显了，可为什么第一次写的时候想不到呢~~（答：为了压行）~~

还有又双叒叕没开``long long``

~~以及这东西调起来真爽~~

### Code

```c++
#include<bits/stdc++.h>
#define FIO "4712"
#define ll long long
using namespace std;
const int N=2e5+5;
const ll INF=1e15;
int w[N],n,x,y,head[N],to[N<<1],nxt[N<<1],ecnt;
ll dp[N],g[N];
int top[N],id[N],rnk[N],fa[N],dep[N],son[N],sz[N],len[N],cnt,q;
char ch;
inline void add(int u,int v){nxt[++ecnt]=head[u];head[u]=ecnt;to[ecnt]=v;}
inline void dfs1(int u){
	sz[u]++;
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]){
	a[v]=u;dep[v]=dep[u]+1;dfs1(v);sz[u]+=sz[v];if(!son[u]||sz[v]>sz[son[u]])son[u]=v;
	}
}
//id[u]=i rnk[i]=u
inline void dfs2(int u,int t){
	top[u]=t;len[t]++;
	id[u]=++cnt;rnk[cnt]=u;
	if(son[u])dfs2(son[u],t),dp[u]+=dp[son[u]];
	for(int i=head[u],v;i;i=nxt[i])if((v=to[i])^fa[u]&&v^son[u])
		dfs2(v,v),g[u]+=dp[v];
	if(!son[u])g[u]=INF,dp[u]=w[u];
	else dp[u]=min(dp[u]+g[u],(ll)w[u]);
}

struct matrix{
	ll v[2][2];
	matrix(){v[0][0]=v[0][1]=v[1][0]=v[1][1]=INF;}
	inline ll* operator [](int x){ return v[x]; }
	matrix operator *(matrix t){
		matrix ret;
		for(int i=0;i<2;i++) for(int j=0;j<2;j++) for(int k=0;k<2;k++)
			ret[i][j]=min(ret[i][j],v[i][k]+t[k][j]);
		return ret;
	}
	inline void out(){printf("%lld %lld\n%lld %lld\n-----\n",v[0][0],v[0][1],v[1][0],v[1][1]);}
}a[N<<2],val[N];
#define mid ((l+r)>>1)
#define lk (k<<1)
#define rk (k<<1|1)
inline void pushup(int k){a[k]=a[lk]*a[rk];}
inline void build(int k,int l,int r){
	if(l==r){
		a[k][0][0]=g[rnk[l]];a[k][0][1]=w[rnk[l]];a[k][1][0]=a[k][1][1]=0;
		val[l]=a[k];
		return;
	}
	build(lk,l,mid);build(rk,mid+1,r);
	pushup(k);
}
inline matrix qry(int k,int l,int r,int ql,int qr){
	//if(k==1)printf("qrying%d-%d\n",ql,qr);
	if(ql<=l&&r<=qr)return a[k];
	if(qr<=mid)return qry(lk,l,mid,ql,qr);
	if(mid<ql)return qry(rk,mid+1,r,ql,qr);
	return qry(lk,l,mid,ql,mid)*qry(rk,mid+1,r,mid+1,qr);
}
inline matrix qry(int u){ return qry(1,1,n,id[u],id[top[u]]+len[top[u]]-1); }
inline void modify(int k,int l,int r,int pos){
	if(l==r){a[k]=val[l];return;}
	if(pos<=mid)modify(lk,l,mid,pos);
	else modify(rk,mid+1,r,pos);
	pushup(k);
}

inline void modify(int u,int x){
	w[u]+=x;val[id[u]][0][1]+=x;
	while(u){
		//printf("u=%d\n",u);
		matrix pre,nxt;
		pre=qry(top[u]);
		modify(1,1,n,id[u]);
		nxt=qry(top[u]);
		u=fa[top[u]];
		//nxt.out();pre.out();
		val[id[u]][0][0]+=nxt[0][1]-pre[0][1];
	}
}
inline void output(int k,int l,int r){
	printf("%d-%d\n",l,r);a[k].out();
	if(l==r)return;
	output(lk,l,mid);output(rk,mid+1,r);
}
#undef mid
#undef lk
#undef rk
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;i++)scanf("%d",&w[i]);
	for(int i=1;i<n;i++)scanf("%d%d",&x,&y),add(x,y),add(y,x);
	dfs1(1);	dfs2(1,1);
	build(1,1,n);
	scanf("%d%*c",&q);
	//for(int i=1;i<=n;i++)printf("val%d:\n",i),val[i].out(); output(1,1,n);
	while(q--){
		scanf("%c%d%*c",&ch,&x);
		if(ch=='Q') {
			matrix ans=qry(x);
			printf("%lld\n",min(ans[0][1],ans[0][0]));
			//ans.out();
		}
	 	else{
			scanf("%d%*c",&y);
			modify(x,y);
			//for(int i=1;i<=n;i++)printf("val%d:\n",i),val[i].out(); output(1,1,n);
		}
	}
	return 0;
}

```
---
## [BZOJ5210](https://lydsy.com/JudgeOnline/problem.php?id=5210)
> ### Description
> 给出一棵$n$个点、以$1$为根的有根树，点有点权。要求支持如下两种操作：
> $M\ x\ y$：将点$x$的点权改为$y$；
> $Q\ x$：求以$x$为根的子树的最大连通子块和。
> 其中，一棵子树的最大连通子块和指的是：该子树所有子连通块的点权和中的最大值
> （本题中子连通块包括空连通块，点权和为$0$）。
>
> ### Input
> 第一行两个整数$n、m$，表示树的点数以及操作的数目。
> 第二行$n$个整数，第$i$个整数$w_i$表示第$i$个点的点权。
> 接下来的$n-1$行，每行两个整数$x、y$，表示$x$和$y$之间有一条边相连。
> 接下来的$m$行，每行输入一个操作，含义如题目所述。保证操作为$M\ x\ y$或$Q\ x$之一。
> $1≤n,m≤200000 $，任意时刻$ |w_i|≤10^9$ 。
>
> ### Output
> 对于每个$Q$操作输出一行一个整数，表示询问子树的最大连通子块和。
>
> ### Sample Input
```
5 4
3 -2 0 3 -1
1 2
1 3
4 2
2 5
Q 1
M 4 1
Q 1
Q 2
```
> ### Sample Output
```
4
3
1
```

### Solution

（并不是）一眼得出转移式子$f[u]=max(0,\sum{f[v]}+w[u])$

矩阵形式
$$
g[u]=\sum_{v是u的轻儿子}{f[v]}\\
\left[
\begin{matrix}
f[u]\\0
\end{matrix}
\right]=
\left[
\begin{matrix}
w[u]+g[u]&0\\
0&0\\
\end{matrix}

\right]
\times
\left[
\begin{matrix}
f[son[u]]\\0
\end{matrix}
\right]
$$

然后有点无聊开始写全局平衡二叉树练(cao)习(bang)。打到快一半才发现每次只是询问子树可能不能这么搞怒删$100$行代码开始打线段树，然后发现可能要求的子块并不包含根，于是怀着这辈子不可能手打平衡树的想法就去搜了下题解发现直接可删堆就行了，而且矩阵也不是必要的，把一个点的虚儿子的贡献加在重链上这个点上后就相当于重链上查一个最大连续子段和，可以用线段树上的一般的搞法即记录每个点左边连续最大$lmax$，右边连续最大$rmax$，总共连续最大$max$以及总和$sum$。

转移即为
$$
a[k].lmax=max(a[lk].lmax,a[lk].sum+a[rk].lmax)\\
a[k].rmax=max(a[rk].rmax,a[lk].rmax+a[rk].sum)\\
a[k].max=max(a[lk].max,a[rk].max,a[lk].rmax+a[rk].lmax)\\
a[k].sum=a[lk].sum+a[rk].sum\\
$$

可删堆的实现~~大家都~~懂就不赘讲了

注意$ch$数组开四倍因为是线段树上的点，由平衡树改成线段树的时候没改可能会调一会。

以及记得照着标程改完后能拍的起的时候记得测下样例，一会标程莫名其妙都改错了就直接$GG$。

### Code

```c++
#include<bits/stdc++.h>
#define FIO "5210"
#define ll long long 
using namespace std;
const int N=2e5+5,INF=1e9;
int w[N],n,m,x,y,sz[N],fa[N],son[N],top[N];
int h[N],to[N<<1],nxt[N<<1],ecnt,ch[N<<2][2],id[N],rnk[N],cnt,ptr,len[N],rt;
ll f[N],g[N];
inline void add(int u,int v){nxt[++ecnt]=h[u];h[u]=ecnt;to[ecnt]=v;}
struct heap{
	priority_queue<ll>de,q;
	inline ll top(){
		while(!de.empty()&&!q.empty()&&q.top()==de.top())q.pop(),de.pop();
		return q.empty()?0:q.top();
	}
	inline void del(ll x){de.push(x);}
	inline void insert(ll x){q.push(x);}
}q[N];//可删堆
inline void dfs1(int u){
	sz[u]=1;f[u]=w[u];
	for(int i=h[u],v;i;i=nxt[i])if((v=to[i])^fa[u]){
		fa[v]=u; dfs1(v);
		if(sz[v]>sz[son[u]])son[u]=v;
		f[u]+=f[v]; sz[u]+=sz[v];
	}
	f[u]=max(f[u],0ll);
}
inline ll dfs2(int u,int t){
	ll ret=0;
	id[u]=++cnt;rnk[cnt]=u;top[u]=t;len[t]++;
	if(son[u])ret=dfs2(son[u],t);
	g[u]=w[u];
	for(int i=h[u],v;i;i=nxt[i])if((v=to[i])^fa[u]&&v^son[u])
	 	g[u]+=f[v],q[u].insert(dfs2(v,v));
	return max(ret,max(f[u],q[u].top()));
}
struct node{
	ll mx,lm,rm,sum;
	node(ll _mx=0,ll _lm=0,ll _rm=0,ll _sum=0){mx=_mx;lm=_lm;rm=_rm;sum=_sum;}
	node operator *(node t){
        //合并两个node的操作，矩乘写惯了这题也用乘号
        //建议对照上方构造函数
		return node(
        max(rm+t.lm,max(mx,t.mx)),
		max(lm,sum+t.lm),
		max(t.rm,rm+t.sum),
		sum+t.sum);
	}
}a[N<<2];
#define lk ch[k][0]
#define rk ch[k][1]
#define mid ((l+r)>>1)
inline void pushup(int k){ a[k]=a[lk]*a[rk]; }
inline node qry(int k,int l,int r,int ql,int qr){
	//fprintf(stderr,"qrying%d-%d %d-%d\n",l,r,ql,qr);
	if(ql<=l&&r<=qr)return a[k];
	if(qr<=mid)return qry(lk,l,mid,ql,qr);
	if(mid<ql)return qry(rk,mid+1,r,ql,qr);
	return qry(lk,l,mid,ql,mid)*qry(rk,mid+1,r,mid+1,qr);
}
inline node qry(int x){return qry(rt,1,n,id[x],id[top[x]]+len[top[x]]-1);}
inline void init(int k,int u){
		a[k].sum=g[u];
		a[k].lm=a[k].rm=max(0ll,g[u]);
		a[k].mx=max(a[k].lm,q[u].top());
}
inline void build(int &k,int l,int r){
	k=++ptr;
	if(l==r){
		init(k,rnk[l]);
		return;
	}
	build(lk,l,mid);build(rk,mid+1,r);
	pushup(k);
}
inline void modify(int k,int l,int r,int pos){
	if(l==r){
		init(k,rnk[l]);
	//	if(l==2)printf("%d %d\n",a[k].lm,q[rnk[l]].top());
	//printf("%d-%d\n%lld %lld\n%lld %lld\n-----\n",l,r,a[k].lm,a[k].rm,a[k].sum,a[k].mx);
		return;
	}
	if(pos<=mid)modify(lk,l,mid,pos);else modify(rk,mid+1,r,pos);
	pushup(k);
}
inline void modify(int u,ll del){
	node pre,nxt;
	bool flag;
	while(u){
		pre=qry(top[u]);
		g[u]+=del;
		//printf("gu=%lld\n",g[u]);
		modify(rt,1,n,id[u]);
		nxt=qry(top[u]);
		del=nxt.lm-f[top[u]];f[top[u]]=nxt.lm;
        //nxt.lm相当于新的这条重链上0或者包含top[u]的这个连通块（一条链）的最值
		u=fa[top[u]];
		if(u)q[u].del(pre.mx),q[u].insert(nxt.mx);
        //top[u]是fa[top[u]]的虚儿子，所以需要在对应的堆里进行更改
	}
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<=n;i++)scanf("%d",&w[i]);
	for(int i=1;i<n;i++)scanf("%d%d",&x,&y),add(x,y),add(y,x);
	dfs1(1);dfs2(1,1);
	build(rt,1,n);
	while(m--){
		char ch=getchar();
		while(ch!='M'&&ch!='Q')ch=getchar();
		scanf("%d",&x);
		if(ch=='M')scanf("%d",&y),modify(x,y-w[x]),w[x]=y;
		else printf("%lld\n",qry(x).mx);
	}
	return 0;
}
```
---

## 总结

动态DP真是个不错的东西，它与题目半身的关联性不大，所以适用范围还是比较广的，啥时候想练练码力了可以来做一做，而且调试起来还非常方(e)便(du)。相信当你在一个寒冷的深冬的夜晚抬起头来，手指早已冻僵却仍不住的按着```F5```，屏幕终于从一直的时而泛紫又时候泛红到泛起一道绿光改了无数遍丑的看不下去的代码终于过了的时候,你一定会由衷的对该题的出题人表示 : \*\*\*\*\*\*\*\*！![恶毒.jpg](https://s1.ax1x.com/2018/12/12/FYvzxH.md.png)
