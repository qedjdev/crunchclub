export default function Link() {
  const tableStyle = { width: 'auto', borderCollapse: 'collapse' as 'collapse' };
  const cellStyle = {
    width: 'auto',
    padding: '8px',
    border: '3px solid black',
    textAlign: 'center' as 'center',
    verticalAlign: 'middle' as 'middle'
  };
  const headerStyle = { ...cellStyle, borderBottom: '5px solid black' };

  return (
    <div style={{ fontFamily: 'Courier, monospace', whiteSpace: 'pre-wrap', paddingLeft: '2rem' }}>
      <ul>
      </ul>
      <table style={tableStyle}>
        <tr>
          <th style={headerStyle}>Names</th>
          <th style={headerStyle}>Emails</th>
          <th style={headerStyle}>Sections</th>
        </tr>
        <tr>
          <td style={cellStyle}>Ben Wakefield</td>
          <td style={cellStyle}>wakefield.ben &#123;at&#125; northeastern &#123;dot&#125; edu</td>
          <td style={cellStyle}>Section 1, CRN 12342</td>
        </tr>
        <tr>
          <td style={cellStyle}></td>
          <td style={cellStyle}> </td>
          <td style={cellStyle}></td>
        </tr>
        <tr>
          <td style={cellStyle}></td>
          <td style={cellStyle}> </td>
          <td style={cellStyle}></td>
        </tr>
        <tr>
          <td style={cellStyle}></td>
          <td style={cellStyle}> </td>
          <td style={cellStyle}></td>
        </tr>
        <tr>
          <td style={cellStyle}></td>
          <td style={cellStyle}> </td>
          <td style={cellStyle}></td>
        </tr>
      </table>
      <br />
      <table>
        <tr>
          <th style={headerStyle}>
            React Project
          </th>
          <th style={headerStyle}>
            NodeJS Project
          </th>
        </tr>
        <tr>
          <td style={cellStyle}>
            <a href="https://github.com/qedjdev/crunchclub/tree/main/frontend">Source</a>
          </td>
          <td style={cellStyle}>
            <a href="https://github.com/qedjdev/crunchclub/tree/main/backend">Source</a>
          </td>
        </tr>
      </table>
    </div >
  );
}