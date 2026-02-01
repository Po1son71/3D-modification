import { Button } from '@/components/UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@radix-ui/react-label';
import React, { useEffect, useState } from 'react';

export default function EditComponentForm({ item, onSave }) {
    const [form, setForm] = useState({
        stackHeight: item?.stackHeight ||"",
        row: item?.row ||"",
        column: item?.column ||"",
        // x: item.position.x, 
        // y: item.position.y
    });

    useEffect(() => {
        setForm({
            stackHeight: item?.stackHeight ||"",
            row: item?.row ||"",
            column: item?.column ||"",
            // x: item.position.x, 
            // y: item.position.y
        });
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Edit Component</CardTitle>
            </CardHeader>

            <CardContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSave({
                            ...item,
                            stackHeight: Number(form.stackHeight),
                            row: Number(form.row),
                            column: Number(form.column),
                        });
                    }}
                    className="space-y-4"
                >
                    {/* Stack Height */}
                    <div className="space-y-1">
                        <Label htmlFor="stackHeight">Stack Height</Label>
                        <Input
                            id="stackHeight"
                            type="number"
                            name="stackHeight"
                            value={form.stackHeight}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Row */}
                    <div className="space-y-1">
                        <Label htmlFor="row">Row</Label>
                        <Input
                            id="row"
                            type="number"
                            name="row"
                            value={form.row}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Column */}
                    <div className="space-y-1">
                        <Label htmlFor="column">Column</Label>
                        <Input
                            id="column"
                            type="number"
                            name="column"
                            value={form.column}
                            onChange={handleChange}
                        />
                    </div>

                    <Button type="submit">
                        Save
                    </Button>
                    <Button type="reset" style={{
                        background: "var(--destructive)"
                    }}>
                        Cancel
                    </Button>

                </form>
            </CardContent>
        </Card>
    );
}
