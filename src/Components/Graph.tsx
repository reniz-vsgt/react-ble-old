import { LineChart } from '@mui/x-charts/LineChart';
const Graph: React.FC<any> = ({
    x,
    y
}) => {
    console.log("Graph");
    
    return (
        <>
            <LineChart
                xAxis={[{ data: x, label: "Ticks" }]}
                series={[
                    {
                        data: y,
                        showMark: false,
                    },
                ]}
                height={600}
                width={900}
                margin={{ left: 30, right: 30, top: 30, bottom: 60 }}
                grid={{ vertical: true, horizontal: true }}
            />
        </>
    )
}

export default Graph;