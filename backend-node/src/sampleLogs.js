export const SAMPLE_LOGS = {
  brute_force: `2024-01-15 03:12:01 WARN  sshd[1234]: Failed password for root from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:03 WARN  sshd[1234]: Failed password for root from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:05 WARN  sshd[1234]: Failed password for root from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:07 WARN  sshd[1234]: Failed password for root from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:09 WARN  sshd[1234]: Failed password for root from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:11 ERROR sshd[1234]: Failed password for root from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:13 ERROR sshd[1234]: Failed password for admin from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:15 ERROR sshd[1234]: Failed password for admin from 192.168.1.105 port 22 ssh2
2024-01-15 03:12:20 INFO  sshd[1234]: Accepted password for ubuntu from 10.0.0.5 port 22 ssh2`,

  sql_injection: `2024-01-15 14:22:01 INFO  nginx: 203.0.113.42 - GET /api/users?id=1 HTTP/1.1 200
2024-01-15 14:22:05 WARN  nginx: 203.0.113.42 - GET /api/users?id=1' HTTP/1.1 500
2024-01-15 14:22:06 WARN  nginx: 203.0.113.42 - GET /api/users?id=1 OR 1=1-- HTTP/1.1 200
2024-01-15 14:22:07 WARN  nginx: 203.0.113.42 - GET /api/users?id=1 UNION SELECT username,password FROM users-- HTTP/1.1 200
2024-01-15 14:22:08 ERROR app: SQL error: syntax error near "UNION SELECT"
2024-01-15 14:22:09 WARN  nginx: 203.0.113.42 - GET /api/users?id=1;DROP TABLE users-- HTTP/1.1 400`,

  malware_c2: `2024-01-15 02:00:01 INFO  firewall: ALLOW TCP 10.0.1.55:49201 -> 185.220.101.47:443
2024-01-15 02:05:01 INFO  firewall: ALLOW TCP 10.0.1.55:49202 -> 185.220.101.47:443
2024-01-15 02:10:01 INFO  firewall: ALLOW TCP 10.0.1.55:49203 -> 185.220.101.47:443
2024-01-15 02:15:01 INFO  firewall: ALLOW TCP 10.0.1.55:49204 -> 185.220.101.47:443
2024-01-15 02:20:01 INFO  firewall: ALLOW TCP 10.0.1.55:49205 -> 185.220.101.47:443
2024-01-15 02:25:01 WARN  dns: Suspicious query: update.totally-legit-software.xyz from 10.0.1.55
2024-01-15 02:25:02 INFO  firewall: ALLOW TCP 10.0.1.55:49206 -> 91.108.4.200:8080
2024-01-15 02:30:00 WARN  edr: Process injection detected: svchost.exe -> cmd.exe on 10.0.1.55`,

  normal: `2024-01-15 09:00:01 INFO  nginx: 10.0.0.10 - GET /index.html HTTP/1.1 200
2024-01-15 09:00:05 INFO  nginx: 10.0.0.11 - POST /api/login HTTP/1.1 200
2024-01-15 09:01:00 INFO  sshd: Accepted publickey for deploy from 10.0.0.20 port 22
2024-01-15 09:05:00 INFO  app: User admin logged in successfully
2024-01-15 09:10:00 INFO  app: Scheduled backup completed successfully`,
}
