yxkj-cli 完整用例
---

---

# 一、安装`yxkj`

全局安装

```bash
npm i . -g
```

---

# 二、`yxkj`功能清单

## 1. 团队管理

创建团队

```bash
yxkj create-team [team-name] [workpace-dir] '{"members": [{"type":"pm"},{"type":"developer"},{"type":"tester"}]}'
```

启动团队

```bash
yxkj start-team [team-name]
```

停止团队

```bash
yxkj stop-team [team-name]
```

## 2. 成员管理

查看团队成员

```bash
yxkj menebers [team-name]
```

批量向团队添加成员

```bash
yxkj members [team-name] '[{"type":"pm"}]'
```

批量移除团队成员

```bash
yxkj members [team-name] -d -n [member1-name] [member1-name] -t [member-type]
```

## 3. OpenCode

```bash
yxkj opencode run ./workspace/myteam '创建README.md文件，并写入“test”'
```