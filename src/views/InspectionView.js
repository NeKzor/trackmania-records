import React from 'react';
import Paper from '@material-ui/core/Paper';
import ViewContent from './ViewContent';
import { api2, trackmaniaApi } from '../Api';
import { useLocation, useParams, useHistory } from 'react-router-dom';
import { useTitle } from '../Hooks';

const InspectionView = () => {
    useTitle('Inspection');

    const params = useParams();
    const [inspection, setInspection] = React.useState({ track: {}, records: [], inspections: [] });

    React.useEffect(() => {
        trackmaniaApi.getInspection(params.record)
            .then((data) => setInspection(data))
            .catch(console.error);
    }, [params]);

    const targetInspection = React.useMemo(() => {
        return inspection.inspections.find(({ record_id }) => record_id === params.record);
    }, [inspection, params.record]);

    return (
        <ViewContent>
            <Paper>
                {targetInspection && (
                    <>
                        Target: {targetInspection._id}
                    </>
                )}
                {inspection.inspections.map((inspection) => {
                    return (
                        <div key={inspection._id}>{inspection._id}</div>
                    );
                })}
            </Paper>
        </ViewContent>
    );
};

export default InspectionView;
