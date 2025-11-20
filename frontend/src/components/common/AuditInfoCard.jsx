import React from 'react';

const AuditInfoCard = ({ data }) => {
    if (!data) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="card mt-4">
            <div className="card-header">
                <h5 className="mb-0">
                    <i className="bi bi-clock-history me-2"></i>Audit Information
                </h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6">
                        <table className="table table-borderless mb-0">
                            <tbody>
                                <tr>
                                    <td className="text-muted" style={{ width: '40%' }}>
                                        <strong>Created At</strong>
                                    </td>
                                    <td>{formatDate(data.created_at)}</td>
                                </tr>
                                <tr>
                                    <td className="text-muted">
                                        <strong>Created By</strong>
                                    </td>
                                    <td>{data.created_by || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-md-6">
                        <table className="table table-borderless mb-0">
                            <tbody>
                                <tr>
                                    <td className="text-muted" style={{ width: '40%' }}>
                                        <strong>Updated At</strong>
                                    </td>
                                    <td>{formatDate(data.updated_at)}</td>
                                </tr>
                                <tr>
                                    <td className="text-muted">
                                        <strong>Updated By</strong>
                                    </td>
                                    <td>{data.updated_by || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditInfoCard;
