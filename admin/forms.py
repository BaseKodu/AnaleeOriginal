"""
Forms for admin functionality
Separated from main application forms to maintain isolation
"""
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField, TextAreaField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, Optional

class AdminChartOfAccountsForm(FlaskForm):
    """Form for managing system-wide Chart of Accounts"""
    account_code = StringField('Account Code', 
                             validators=[DataRequired(), Length(min=1, max=20)])
    name = StringField('Account Name', 
                      validators=[DataRequired(), Length(min=1, max=100)])
    category = SelectField('Category',
                         choices=[
                             ('Assets', 'Assets'),
                             ('Liabilities', 'Liabilities'),
                             ('Equity', 'Equity'),
                             ('Income', 'Income'),
                             ('Expenses', 'Expenses')
                         ],
                         validators=[DataRequired()])
    sub_category = StringField('Sub Category', 
                             validators=[Optional(), Length(max=50)])
    description = TextAreaField('Description', 
                              validators=[Optional(), Length(max=500)])
    submit = SubmitField('Add Account')

class ChartOfAccountsUploadForm(FlaskForm):
    """Form for uploading Chart of Accounts Excel file"""
    excel_file = FileField('Excel File',
                          validators=[
                              FileRequired(),
                              FileAllowed(['xlsx'], 'Excel files only!')
                          ])
    submit = SubmitField('Upload Chart of Accounts')