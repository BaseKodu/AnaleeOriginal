from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired

class AccountForm(FlaskForm):
    link = StringField('Link', validators=[DataRequired()])
    name = StringField('Account Name', validators=[DataRequired()])
    category = StringField('Category', validators=[DataRequired()])
    sub_category = StringField('Sub Category')
    account_code = StringField('Account Code')
    submit = SubmitField('Add Account')
