import { DoorClosed } from 'lucide-react'
import DashboardPage from '../DashboardPage'

const assignments = [
  { room: 'A-102', building: 'North Hall', faculty: 'Dr. Elena Cruz', department: 'Computer Science', status: 'Assigned' },
  { room: 'B-204', building: 'West Residence', faculty: 'Prof. Marcus Lee', department: 'Engineering', status: 'Assigned' },
  { room: 'C-307', building: 'Central Hall', faculty: 'Dr. Priya Shah', department: 'Business Studies', status: 'Assigned' },
  { room: 'D-118', building: 'South Hall', faculty: 'Prof. Daniel Reed', department: 'Arts and Design', status: 'Pending review' },
]

export default function RoomsTaken() {
  return (
    <DashboardPage icon={DoorClosed} title="Rooms taken" description="See which faculty members are assigned to occupied rooms.">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-900">Faculty room assignments</h3><p className="mt-1 text-xs text-slate-500">Current room assignments across campus</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-bold">Room</th><th className="px-5 py-3 font-bold">Building</th><th className="px-5 py-3 font-bold">Faculty member</th><th className="px-5 py-3 font-bold">Department</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{assignments.map((assignment) => <tr key={assignment.room} className="text-slate-600"><td className="px-5 py-4 font-bold text-slate-900">{assignment.room}</td><td className="px-5 py-4">{assignment.building}</td><td className="px-5 py-4 font-semibold text-slate-800">{assignment.faculty}</td><td className="px-5 py-4">{assignment.department}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${assignment.status === 'Assigned' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{assignment.status}</span></td></tr>)}</tbody></table></div>
      </div>
    </DashboardPage>
  )
}
