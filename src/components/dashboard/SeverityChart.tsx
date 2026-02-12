import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Incident } from '@/context/IncidentsContext';

interface SeverityChartProps {
  incidents: Incident[];
}

export function SeverityChart({ incidents }: SeverityChartProps) {
  const severityCounts = {
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    low: incidents.filter(i => i.severity === 'low').length,
    info: incidents.filter(i => i.severity === 'info').length,
  };

  const data = [
    { name: 'Critical', value: severityCounts.critical, color: 'hsl(0, 84%, 60%)' },
    { name: 'High', value: severityCounts.high, color: 'hsl(25, 95%, 53%)' },
    { name: 'Medium', value: severityCounts.medium, color: 'hsl(45, 93%, 47%)' },
    { name: 'Low', value: severityCounts.low, color: 'hsl(210, 100%, 56%)' },
    { name: 'Info', value: severityCounts.info, color: 'hsl(217, 33%, 50%)' },
  ].filter(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border bg-card p-5"
    >
      <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
        Incidents by Severity
      </h3>

      <div className="flex items-center gap-4">
        <div className="h-[180px] w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 10%)',
                  border: '1px solid hsl(217, 33%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}