---
title: FFT&NTT
date: 2020-2-18 22:08:01
tags: 
  - 数学
  - FFT
  - NTT
mathjax: true
categories: 总结

---

# FFT&NTT

## FFT

### DFT

**单位根定义**

> $\omega_n=\cos (\frac {2\pi}{n})+i\sin (\frac {2\pi}{n})$

得到 $\omega_n^k=\cos(\frac{2k\pi}{n})+i\sin(\frac{2k\pi}{n})$

**单位根性质**

> 0. $\omega_n^0=1,\omega_n^{n/2}=-1$
> 1. $\omega_{dn}^{dk}=\omega_{n}^{k}$
> 2. $\omega_{n}^{i+n/2}=\omega_{n}^{n/2}\cdot\omega_{n}^{i}=-\omega_{n}^{i}$

令 $F_n(x)=\sum_{i=0}^{n-1}f_ix^i$

$F_0(x)=\sum_{i=0}^{n/2-1}f_{2i}x^i,F_1(x)=\sum_{i=0}^{n/2-1}f_{2i+1}x^i$

得到

$F(x)=F_0(x^2)+xF_1(x^2)$

$$
\begin{aligned}
F(\omega_n^i)&=F_0(\omega_n^{2i})+\omega_n^iF_1(\omega_n^{2i})
\\&=
F_0(\omega_{n/2}^i)+\omega_n^iF_1(\omega_{n/2}^i)
\\
F(\omega_n^{i+n/2})&=F(-\omega_n^{i})=F_0(\omega_n^{2i})-\omega_n^iF_1(\omega_n^{2i})
\\&=
F_0(\omega_{n/2}^i)-\omega_n^iF_1(\omega_{n/2}^i)
\end{aligned}
$$

每一项系数 $f_i$ 对第 $j$ 个点值表示的贡献是 $f_i(\omega_n^j)^i$

### IDFT

把``DFT``的过程写成矩阵的形式

$$
\begin{bmatrix}
 (\omega_n^0)^0 & (\omega_n^0)^1 & \cdots & (\omega_n^0)^{n-1} \\
 (\omega_n^1)^0 & (\omega_n^1)^1 & \cdots & (\omega_n^1)^{n-1} \\
 \vdots & \vdots & \ddots & \vdots \\
 (\omega_n^{n-1})^0 & (\omega_n^{n-1})^1 & \cdots & (\omega_n^{n-1})^{n-1} 
\end{bmatrix} 
\begin{bmatrix}
 f_0 \\ f_1 \\ \vdots \\ f_{n-1} 
\end{bmatrix} 
= 
\begin{bmatrix} 
F(\omega_n^0) \\ 
F(\omega_n^1) \\ 
\vdots \\ 
F(\omega_n^{n-1}) 
\end{bmatrix}
$$


尝试得到左边矩阵（记为 $\mathbf V$ ）的逆，~~精心构造得到：~~

$$
\mathbf D = \begin{bmatrix} (\omega_n^{-0})^0 & (\omega_n^{-0})^1 & \cdots & (\omega_n^{-0})^{n-1} \\ (\omega_n^{-1})^0 & (\omega_n^{-1})^1 & \cdots & (\omega_n^{-1})^{n-1} \\ \vdots & \vdots & \ddots & \vdots \\ (\omega_n^{-(n-1)})^0 & (\omega_n^{-(n-1)})^1 & \cdots & (\omega_n^{-(n-1)})^{n-1} \end{bmatrix}
$$

发现若 $\mathbf{E=D\cdot V}$

$$
\begin{aligned}
e_{i,j}&=\sum_{k=0}^{n-1}v_{i,k}d_{k,j}
\\&=
\sum_{k=0}^{n-1}v_{i,k}d_{k,j}
\\&=
\sum_{k=0}^{n-1}
(\omega_n^i)^k
(\omega_n^{-k})^j
\\&=
\sum_{k=0}^{n-1}
(\omega_n^k)^{i-j}
\\&=
\begin{cases}
n,&i=j\\
\sum_{k=0}^{n-1}
(\omega_n^{i-j})^k
=\frac{1-(\omega_n^{i-j})^{n}}{1-\omega_n^{i-j}}=0,&i\neq j
\end{cases}
\end{aligned}
$$

所以得到
$\mathbf{D\cdot V}=\mathbf E=n\cdot \mathbf I$

即 $\frac 1n\mathbf D=\mathbf V^{-1}$

$$
\begin{bmatrix} f_0 \\ f_1 \\ \vdots \\ f_{n-1} \end{bmatrix} = \frac{1}{n} \begin{bmatrix} (\omega_n^{-0})^0 & (\omega_n^{-0})^1 & \cdots & (\omega_n^{-0})^{n-1} \\ (\omega_n^{-1})^0 & (\omega_n^{-1})^1 & \cdots & (\omega_n^{-1})^{n-1} \\ \vdots & \vdots & \ddots & \vdots \\ (\omega_n^{-(n-1)})^0 & (\omega_n^{-(n-1)})^1 & \cdots & (\omega_n^{-(n-1)})^{n-1} \end{bmatrix} \begin{bmatrix} F(\omega_n^0) \\ F(\omega_n^1) \\ \vdots \\ F(\omega_n^{n-1}) \end{bmatrix}
$$

把``IDFT``的系数取倒数（即直接虚部取相反数）做一遍``DFT``再除以 $n$ 即可

---

## NTT

> 对于一个质数 $p$ ，其原根 $g$ 满足 $g^0,g^1,g^2,\cdots ,g^{p−2}$ 在模 $p$ 意义下两两不同

所以 $\omega_n\to g^{(p-1)/n}$

这就需要 $p-1$ 是 $2$ 的幂

> 0. $\omega_n^0=1,\omega_n^{n/2}=-1$

$(g^{(p-1)/n})^0=g^0=1$

$(g^{(p-1)/2})^2=g^{p-1}=1$ 所以 $g^{(p-1)/2}=\pm 1$

因为 $g^0\neq g^1\neq g^2\neq \cdots\neq  g^{p-2}$ 且 $g^0=1$ 所以 $g^{(p-1)/2}\neq 1$ 所以 $g^{(p-1)/2}=-1$ 

$(g^{(p-1)/n})^{n/2}=g^{(p-1)/2}=-1$

> 1. $\omega_{dn}^{dk}=\omega_{n}^{k}$

$(g^{(p-1)/(dn)})^{dk}=g^{k(p-1)/n}$

> 2. $\omega_{n}^{i+n/2}=\omega_{n}^{n/2}\cdot\omega_{n}^{i}=-\omega_{n}^{i}$

$(g^{(p-1)/n})^{i+n/2}=(g^{(p-1)/n})^{n/2}\cdot(g^{(p-1)/n})^{i}=-(g^{(p-1)/n})^{i}$

看上去都没什么问题

> $\frac{1-(\omega_n^{i-j})^{n}}{1-\omega_n^{i-j}}=0$

$
\frac{1-((g^{(p-1)/n})^{i-j})^{n}}{1-(g^{(p-1)/n})^{i-j}}=
\frac{1-((g^{(p-1)})^{i-j})}{1-(g^{(p-1)/n})^{i-j}}=
\frac{1-1^{i-j}}{1-(g^{(p-1)/n})^{i-j}}=0
$

所以 DFT 等操作的写法和 FFT 基本等价

---

### HDU 6067

$ans=\prod_{x=1}^{k-1}\left(\sum_{i=0}^ng_{x,i}\frac{x^i}{i!}\right)[x^n]\times n!$

每次更改一个多项式的一项系数

对于其点值表示的影响可以顺次算出来

再算一个所有多项式的对应的 $L$ 个点值表示，改了一个就先除去再修改再乘上即可

因为可能有 $0$ 不能直接除要记录一下 $0$ 的个数

最后求 $ans$ 不能每次都还原多项式算和可能常数太大，发现最后求的是一堆多项式的第 $n$ 项和，直接记录点值和，最后再从这个点值反推回所有的多项式的和对应系数和即可

~~过了这题才发现一直以来的`NTT``的单位根都处理反了...~~

一开始以为``NTT``长度只用到 $n$ 然而是每个数最多出现 $n$ 次，``NTT``长度是 $10n$ 

**记得去掉第 $0$ 位的答案，因为不存在只有 $0$ 位的数字**

**这题模数小最好预处理逆元到 $MOD$ 不然复杂度多个 $\log$ 可能过不了**

---

### cf286E

每个能表示出来的数一定能被至多两个数表示出来，否则假如只能由 $a+b+c$ 表示，那么就一定不能表示 $a+b$ 

相当于这个集合对加法封闭

直接对集合里出现的数做集合幂级数再并上一个 $0$ 即可

考虑每一位：

- 如果原来为 $0$ 现在不为 $0$ 那么这个集合不是封闭的输出``NO`` 

- 如果原来不为 $0$ 现在为 $0$ 不可能因为 $0$ 次项是 $1$

- 如果原来为 $0$ 现在也为 $0$ 不影响

- 如果原来不为 $0$ 现在也不为 $0$ 那么看它的值是否是 $2$ 是的话就只能是 $0+i$ 和 $i+0$ 凑出来，这个数就必选;否则一定有两个非零的和为 $i$ ，这个数可以被其他数表示出来所以不必选

---

### BZOJ4836 二元运算

在值域上分治，每次直接算两遍左边卷右边的东西贡献到答案数组上

最后每次 $O(1)$ 出答案

---

### cf553E Kyoya and Train

设 $f_{u,x}$ 表示在时间 $x$ 时点 $u$ 到 $n$ 所需要的最短路的期望

则 $f_{u,x}=\min_{(u,v)\in E}c_{u,v}+\sum_{d=0}^tf_{v,x+d}\times P_{t_{u,v}=d}$

令后者为 $g_{i,x}$ 即第 $i$ 条边的东西

转移就成了 $f_{u,x}=\min_{(u,v)\in E}c_{u,v}+g_{v,t}$

然后这个 $g$ 的转移即为

$g_{u,x}=\sum_{d=0}^tf_{v,x+d}\times P_{t_{u,v}=d}$

是一个卷积的形式，直接分治 fft 就搞完了

然后记得当把 $[mid+1,r]$ 更新到 $[l,mid]$ 时的 $P$ 数组要开 $r-l+1$ 而不是 $r-mid+1$ 因为要把 $f_r$ 对 $g_l$ 的贡献全部算进去而不是只是 $f_r\to g_{mid}\cdots f_{mid+1}\to g_l$ 这样

注意边界的最小最大值各取什么，不要想着有``clang++``查错，一个边界的小问题可能卡半个多小时

---

### BZOJ4451 Frightful Formula

$$
ans=
\sum_{i=2}^nf_{1,i}\times a^{n-i}b^{n-1}\binom{2n-i-2}{n-i}
+
\sum_{i=2}^nf_{i,1}\times a^{n-1}b^{n-i}\binom{2n-i-2}{n-i}
+
\sum_{i=2}^n\sum_{j=2}^nc\times \binom{2n-i-j}{n-i}a^{n-j}b^{n-i}
$$

$$
\begin{aligned}
&\sum_{i=2}^n\sum_{j=2}^nc\times \binom{2n-i-j}{n-i}a^{n-j}b^{n-i}
\\=&
c\sum_{i=2}^n\sum_{j=2}^n\binom{2n-i-j}{n-i}a^{n-j}b^{n-i}
\\=&
c\sum_{i=0}^{n-2}\sum_{j=0}^{n-2}\binom{i+j}{i}a^{j}b^{i}
\\=&
c\sum_{k=0}^{2n-4}\sum_{i=0}^{n-2}\binom{k}{i}a^{k-i}b^{i}
\\=&
c\sum_{k=0}^{2n-4}k!\sum_{i=0}^{n-2}\frac{a^{k-i}}{(k-i)!}\frac{b^i}{i!}
\end{aligned}
$$

这已经可以直接任意模数``NTT``做了，只是常数大


由于这题的形式特殊，尝试再推一些东西

令 $f_n=\sum_{i=0}^n\sum_{j=0}^n\binom{i+j}{i}a^ib^j$

则上面那个东西就是 $c\times f_{n-2}$

$$
\begin{aligned}
f_{n}=&
\sum_{i=0}^n\sum_{j=0}^n\binom{i+j}{i}a^ib^j
\\=&
\sum_{i=0}^{n-1}\sum_{j=0}^{n-1}\binom{i+j}{i}a^ib^j+\sum_{i=0}^n\binom{i+n}{i}a^ib^n+\sum_{j=0}^n\binom{n+j}{n}a^nb^j-\binom{2n}{n}a^nb^n
\\=&
f_{n-1}+\sum_{i=0}^n\binom{i+n}{i}a^ib^n+\sum_{j=0}^n\binom{n+j}{n}a^nb^j-\binom{2n}{n}a^nb^n
\end{aligned}
$$

边界是 $f_0=1$

后两项是类似的，以 $g_a(n)=\sum_{i=0}^n\binom{i+n}{i}a^ib^n$ 为例


$$
\begin{aligned}
g_a(n)=&\sum_{i=0}^n\binom{i+n}{i}a^ib^n
\\=&
\sum_{i=0}^n\left(\binom{i+n-1}{i}+\binom{i+n-1}{i-1}\right)a^ib^{n}
\\=&
\sum_{i=0}^n\binom{i+n-1}{i}a^ib^n+\sum_{i=0}^n\binom{i+n-1}{i-1}a^ib^{n}
\\=&
b\times \sum_{i=0}^{n-1}\binom{i+n-1}{i}a^ib^{n-1}+\binom{2n-1}{n}a^nb^n+\sum_{i=0}^n\binom{i+n-1}{i-1}a^ib^{n}
\\=&
b\times g_a(n-1)+\binom{2n-1}{n}a^nb^n+a\times \sum_{i=0}^{n-1}\binom{i+n}{i}a^ib^n 
\\=&
b\times g_a(n-1)+\binom{2n-1}{n}a^nb^n+a\times \left(g_a(n)-\binom{2n}{n}a^nb^n\right)
\\=&
b\times g_a(n-1)+\binom{2n-1}{n}a^nb^n+a\times g_a(n)-\binom{2n}{n}a^{n+1}b^n
\end{aligned}
$$

边界 $g_a(0)=1$

得到

$(1-a)g_a(n)=b\times ga_(n-1)+\binom{2n-1}{n}a^nb^n-\binom{2n}{n}a^{n+1}b^n$

当 $a=1$ 时有

$$
0=b\times g_a(n-1)+\binom{2n-1}{n}b^n-\binom{2n}{n}b^n\\
\therefore 
g_a(n-1)=b^{n-1}\left(\binom{2n}n-\binom{2n-1}{n}\right)=b^{n-1}\binom{2n-1}{n-1}\\
g_a(n)=b^n\binom{2n+1}{n}
$$

$$
g_a(n)=
\begin{cases}
\frac 1{1-a}\left(b\times g_a(n-1)+\binom{2n-1}{n}a^nb^n-\binom{2n}{n}a^{n+1}b^n\right),&a\neq 1\\
b^n\binom{2n+1}{n},&a=1\\
\end{cases}
$$

同理

$$
g_b(n)=
\begin{cases}
\frac 1{1-b}\left(a\times g_b(n-1)+\binom{2n-1}{n}b^na^n-\binom{2n}{n}b^{n+1}a^n\right),&b\neq 1\\
a^n\binom{2n+1}{n},&b=1\\
\end{cases}
$$

然后递推的时候直接 $f_n=f_{n-1}+g_a(n)+g_b(n)-\binom{2n}{n}a^nb^n$ 非常优质

---

### cf958F

相当于求一堆 $1+x+x^2+x\cdots$ 的积的某一项

直接分治``FTT``常数可能有点问题

改成启发式合并，用个堆维护当前最小的多项式的 $size$ ，每次合并果子一样合并就行了

---

### cf623E

每个数至少使“前缀或”多一位的 $1$，最多 $k$ 位所以当 $n>k$ 时直接``puts("0")``

所以现在 $n,k$ 同阶了

感觉其他人搞得状态有点麻烦就自己搞了一种~~（然后发现差不多麻烦）~~

令 $f_{i,j}$ 表示前 $i$ 个数，一共在 $j$ 个位置下有 $1$ 的方案数，注意这 $j$ 个位置是在 $k$ 中的

最后答案就是 $\sum_{i=1}^kf_{n,i}$ 

一开始想的转移是 $f_{x,i}\times \binom{k-i}{j} 2^i \to f_{x+1,i+j}$

然后发现这个转移太慢了，每次似乎可以转移多个数：

$$
f_{x,i}\times f_{y,j}\times \binom{k-i}{j}\times 2^{yi}\to f_{x+y,i+j}
$$

那个 $2^{yi}$ 是因为对于右边的 $y$ 个数的每一个来说，左边 $i$ 位可以任选 $0/1$ 所以是 $(2^i)^y=2^{iy}$

然后高兴地打了个分治，~~然后样例就挂了~~

因为这个 $f_{y,j}$ 是考虑了 $j$ 位在 $k$ 中的位置的，而我们的 $\binom{k-i}{j}$ 相当于已经给这 $j$ 位确定了位置

所以 $f_{y,j}$ 还要除以 $\binom{k}{j}$ 才是不考虑在 $k$ 中顺序的方案数

转移即为

$$
f_{x,i}\times \frac{f_{y,j}}{\binom{k}{j}}\times \binom{k-i}{j}\times 2^{yi}\to f_{x+y,i+j}
$$

然后又调了一年：

  - ``fft``精度差要+0.5

  - 每次 $w\times=wn$ 时精度丢失也很严重
















