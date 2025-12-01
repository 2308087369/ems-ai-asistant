// 模拟能源站点数据类型
export interface SiteData {
  name: string
  currentPower: number // kW
  dailyEnergy: number // kWh
  profit: number // 元
  efficiency: number // %
  status: "online" | "offline" | "warning"
  temperature: number // °C
  humidity: number // %
}

export interface AllSitesData {
  [siteName: string]: {
    当前功率: string
    日发电量: string
    当日盈利: string
    运行效率: string
    状态: string
    温度: string
    湿度: string
  }
}

// 生成模拟的站点数据
export function generateSiteData(): SiteData[] {
  const sites = [
    { name: "光伏站点A", basePower: 850 },
    { name: "光伏站点B", basePower: 1200 },
    { name: "风电站点C", basePower: 2100 },
    { name: "储能站点D", basePower: 500 },
    { name: "综合站点E", basePower: 1600 },
  ]

  return sites.map((site) => {
    const powerVariation = (Math.random() - 0.5) * 200
    const currentPower = Math.max(0, site.basePower + powerVariation)
    const efficiency = 85 + Math.random() * 12
    const dailyEnergy = currentPower * (8 + Math.random() * 4)
    const profit = dailyEnergy * (0.4 + Math.random() * 0.2)

    return {
      name: site.name,
      currentPower: Math.round(currentPower),
      dailyEnergy: Math.round(dailyEnergy),
      profit: Math.round(profit * 100) / 100,
      efficiency: Math.round(efficiency * 10) / 10,
      status: Math.random() > 0.1 ? "online" : Math.random() > 0.5 ? "warning" : "offline",
      temperature: Math.round(25 + Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 30),
    }
  })
}

// 将站点数据转换为AI提示词所需的JSON格式
export function formatSitesDataForAI(sites: SiteData[]): AllSitesData {
  const result: AllSitesData = {}

  sites.forEach((site) => {
    result[site.name] = {
      当前功率: `${site.currentPower}kW`,
      日发电量: `${site.dailyEnergy}kWh`,
      当日盈利: `${site.profit}元`,
      运行效率: `${site.efficiency}%`,
      状态: site.status === "online" ? "在线" : site.status === "warning" ? "告警" : "离线",
      温度: `${site.temperature}°C`,
      湿度: `${site.humidity}%`,
    }
  })

  return result
}

// 计算汇总数据
export function calculateSummary(sites: SiteData[]) {
  const totalPower = sites.reduce((acc, site) => acc + site.currentPower, 0)
  const totalEnergy = sites.reduce((acc, site) => acc + site.dailyEnergy, 0)
  const totalProfit = sites.reduce((acc, site) => acc + site.profit, 0)
  const avgEfficiencyRaw = sites.reduce((acc, site) => acc + site.efficiency, 0)
  const avgEfficiency = sites.length > 0 ? avgEfficiencyRaw / sites.length : 0
  const onlineCount = sites.filter((site) => site.status === "online").length

  return {
    totalPower: Math.round(totalPower),
    totalEnergy: Math.round(totalEnergy),
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgEfficiency: Math.round(avgEfficiency * 10) / 10,
    onlineCount,
    totalCount: sites.length,
  }
}
