import React from 'react';
import ReactJson from 'react-json-view';
import Paper from '@material-ui/core/Paper';
import ViewContent from './ViewContent';
import { useIsMounted } from '../Hooks';

const NotFoundView = () => {
    const isMounted = useIsMounted();

    const [replay, setReplay] = React.useState({});

    const handleChange = React.useCallback((ev) => {
        var file = ev.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.file = file;
            reader.onload = function({ target: { result } }) {
                const { Buffer, Replay } = window;

                let replay = Replay.default().read(Buffer.from(result), { parseGhost: true });
                if (!isMounted) return;

                const removeData = (obj) => {
                    Object.keys(obj).forEach((key) => {
                        if (key === '_view') {
                            delete obj._view;
                        } else if (typeof obj[key] === 'object') {
                            removeData(obj[key]);
                        }
                    });
                };

                removeData(replay);
                setReplay(replay);
            };
            reader.readAsArrayBuffer(file);
        }
    }, [isMounted, setReplay]);

    React.useEffect(() => {
        document.querySelector('#fileinput').addEventListener('change', handleChange);
        return () => document.querySelector('#fileinput').removeEventListener('change', handleChange);
    }, [handleChange]);

    return (
        <ViewContent>
            <Paper>
                <input type="file" id="fileinput" />
                <ReactJson
                    name="replay"
                    style={{ fontSize: '14px' }}
                    src={replay}
                    theme="solarized"
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={false}
                />
            </Paper>
        </ViewContent>
    );
};

export default NotFoundView;
