Test
---

# 1. 测试 config.js

初始化配置
```bash
script/yxkj config initConfig
```

设置配置
```bash
script/yxkj config set-config 'test' 'value'
```

获取配置
```bash
script/yxkj config get-config 'test'
```


# 2. 团队管理

```bash
# 创建团队
node src/index.js team create myteam /path/to/workspace "我的团队"

# 列出所有团队
node src/index.js team list

# 添加成员
node src/index.js team add-member myteam zhangsan developer

# 显示团队成员
node src/index.js team members myteam

# 修改成员角色
node src/index.js team update-team-member-role myteam zhangsan pm

# 删除团队
node src/index.js team delete myteam
```