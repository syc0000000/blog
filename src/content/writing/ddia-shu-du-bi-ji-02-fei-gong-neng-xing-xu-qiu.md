---
title: 'DDIA 读书笔记 02 · 非功能性需求'
description: 'DDIA 第二章笔记：性能（响应时间与吞吐量）、可靠性、可伸缩性与可维护性这些非功能需求该如何定义和衡量。'
publishedAt: 2026-03-13
updatedAt: 2026-03-15
locale: zh-cn
tags: [DDIA, 后端]
column: DDIA 读书笔记
columnOrder: 2
minutes: 3
---
> 《Designing Data-Intensive Applications》(DDIA) 中文翻译版：[https://ddia.vonng.com/](https://ddia.vonng.com/)

# 非功能性要求

相比于你要实现的功能（业务需求），我们通常会有一些非功能需求，例如快速、可靠、安全、合法合规，并且易于维护，他们跟业务需求一样重要。

这一部分，会介绍：

- 如何定义和衡量系统的性能
- 可靠性的含义
- 如何描述可伸缩性
- 什么是系统的可维护性

## 性能

通常是两个指标：

- 响应时间：就是E2E时延
- 吞吐量：每秒处理的请求数量/数据量

可以认为这两个指标有一定的联系

![image 20250425003512 edd511w](https://nbb-1313023833.cos.ap-chengdu.myqcloud.com/assets/image-20250425003512-edd511w.png)

如果一个系统能够通过增加计算资源显著提高其最大吞吐量，则称该系统具有**可扩展性**。

---

重试风暴：有大量请求在排队等待处理，响应时间可能会增加到客户端超时并重新发送请求的程度。这会导致请求率进一步增加，使问题更加严重。

---

精细化定义延迟与响应时间：

“Latency”和“response time”有时被交替使用，本书中，响应时间是E2E时延，而中间过程被这样拆分。

![image 20250425004659 zuzpjn9](https://nbb-1313023833.cos.ap-chengdu.myqcloud.com/image-20250425004659-zuzpjn9.png)

p50更有参考性，p999通常是优化目标，p9999通常不考虑。

## 可靠性

‍
